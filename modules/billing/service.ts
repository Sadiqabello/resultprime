import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { auditService } from "@/modules/audit/service";
import { PLANS, planByKey, type Plan } from "@/config/plans";
import { initializeTransaction, paystackConfigured, verifyTransaction } from "@/lib/paystack";
import { billingRepository } from "./repository";

export interface BillingView {
  schoolName: string;
  trialEndsAt: string | null;
  paymentsConfigured: boolean;
  subscription: {
    plan: string;
    status: string;
    amount: number | null;
    currency: string;
    currentPeriodEnd: string | null;
  } | null;
  plans: Plan[];
}

/** One subscription period from now (annually or termly ≈ 120 days). */
function periodEnd(interval: Plan["interval"]): string {
  const d = new Date();
  if (interval === "annually") d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 120);
  return d.toISOString();
}

export const billingService = {
  async getBilling(ctx: AuthContext): Promise<Result<BillingView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const [{ data: sub }, { data: school }] = await Promise.all([
      billingRepository.getBySchool(ctx.schoolId),
      billingRepository.getSchool(ctx.schoolId),
    ]);
    return ok({
      schoolName: (school?.name as string) ?? "Your school",
      trialEndsAt: (school?.trial_ends_at as string | null) ?? null,
      paymentsConfigured: paystackConfigured(),
      subscription: sub
        ? {
            plan: sub.plan as string,
            status: sub.status as string,
            amount: (sub.amount as number | null) ?? null,
            currency: (sub.currency as string) ?? "NGN",
            currentPeriodEnd: (sub.current_period_end as string | null) ?? null,
          }
        : null,
      plans: PLANS,
    });
  },

  /** Start a Paystack checkout for a plan; returns the authorization URL to redirect to. */
  async startCheckout(ctx: AuthContext, planKey: string): Promise<Result<{ authorizationUrl: string }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "school.configure")) return err("FORBIDDEN", "Only a school admin can manage billing.");
    if (!paystackConfigured()) return err("CONFLICT", "Payments aren't configured yet (PAYSTACK_SECRET_KEY).");

    const plan = planByKey(planKey);
    if (!plan) return err("VALIDATION", "Unknown plan.");

    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data: school } = await billingRepository.getSchool(ctx.schoolId);
    const email = (school?.email as string) || user?.email;
    if (!email) return err("CONFLICT", "Add a billing email to your school profile first.");

    const reference = `sub_${ctx.schoolId}_${Date.now()}`;
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const res = await initializeTransaction({
      email,
      amountKobo: Math.round(plan.amount * 100),
      reference,
      callbackUrl: `${base}/billing/callback`,
      metadata: { school_id: ctx.schoolId, plan: plan.key },
    });
    if (!res.ok || !res.authorizationUrl) return err("INTERNAL", res.error ?? "Could not start checkout.");
    logger.info("billing.checkout_started", { schoolId: ctx.schoolId, plan: plan.key, reference });
    return ok({ authorizationUrl: res.authorizationUrl });
  },

  /**
   * Apply a successful payment to the school's subscription. Shared by the
   * webhook (authenticated by signature) and the callback page (after verify).
   * Uses the service-role upsert. Idempotent.
   */
  async applyPayment(args: { schoolId: string; planKey: string; amountKobo?: number; customerCode?: string }): Promise<void> {
    const plan = planByKey(args.planKey);
    await billingRepository.upsertViaAdmin(args.schoolId, {
      plan: args.planKey,
      status: "active",
      provider: "paystack",
      customer_code: args.customerCode ?? null,
      amount: args.amountKobo != null ? args.amountKobo / 100 : plan?.amount ?? null,
      currency: plan?.currency ?? "NGN",
      current_period_end: periodEnd(plan?.interval ?? "annually"),
      last_payment_at: new Date().toISOString(),
    });
    await auditService.record({
      schoolId: args.schoolId,
      actorId: args.schoolId, // system/webhook actor; no user
      action: "billing.payment_succeeded",
      entityType: "subscription",
      entityId: args.schoolId,
      metadata: { plan: args.planKey, amountKobo: args.amountKobo ?? null },
    });
    logger.info("billing.payment_applied", { schoolId: args.schoolId, plan: args.planKey });
  },

  /** Handle a verified Paystack webhook event. */
  async handleWebhookEvent(event: { event?: string; data?: Record<string, unknown> }): Promise<{ ok: boolean; handled: string }> {
    const type = event.event ?? "";
    const data = event.data ?? {};
    const metadata = (data.metadata as Record<string, unknown>) ?? {};
    const schoolId = metadata.school_id as string | undefined;
    const planKey = (metadata.plan as string | undefined) ?? "standard";

    if (type === "charge.success" && schoolId) {
      const customer = (data.customer as { customer_code?: string } | undefined)?.customer_code;
      await this.applyPayment({ schoolId, planKey, amountKobo: data.amount as number | undefined, customerCode: customer });
      return { ok: true, handled: "charge.success" };
    }

    if ((type === "subscription.disable" || type === "invoice.payment_failed") && schoolId) {
      await billingRepository.upsertViaAdmin(schoolId, { status: type === "subscription.disable" ? "canceled" : "past_due" });
      return { ok: true, handled: type };
    }

    return { ok: true, handled: `ignored:${type}` };
  },

  /** Callback page: verify a reference with Paystack and apply if successful. */
  async verifyAndApply(ctx: AuthContext, reference: string): Promise<Result<{ status: string }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const v = await verifyTransaction(reference);
    if (!v.ok) return err("INTERNAL", v.error ?? "Could not verify payment.");
    if (v.status !== "success") return ok({ status: v.status ?? "pending" });

    const schoolId = (v.metadata?.school_id as string | undefined) ?? ctx.schoolId;
    if (schoolId !== ctx.schoolId) return err("FORBIDDEN", "Payment belongs to another school.");
    await this.applyPayment({
      schoolId,
      planKey: (v.metadata?.plan as string | undefined) ?? "standard",
      amountKobo: v.amountKobo,
      customerCode: v.customerCode,
    });
    return ok({ status: "success" });
  },
};
