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
      callbackUrl: `${base}/subscription/callback`,
      metadata: { school_id: ctx.schoolId, plan: plan.key },
    });
    if (!res.ok || !res.authorizationUrl) return err("INTERNAL", res.error ?? "Could not start checkout.");
    logger.info("billing.checkout_started", { schoolId: ctx.schoolId, plan: plan.key, reference });
    return ok({ authorizationUrl: res.authorizationUrl });
  },

  /**
   * Apply a successful payment to the school's subscription. Shared by the
   * webhook (authenticated by signature) and the callback page (after verify).
   *
   * Idempotent and race-safe: the payment `reference` is recorded first under a
   * UNIQUE index, so a duplicate (Paystack retry, or webhook + callback racing)
   * is detected and skipped — applying twice would double-extend the paid period
   * since current_period_end is computed from "now". Returns a Result so callers
   * can fail the webhook and let Paystack retry on a genuine error.
   */
  async applyPayment(args: {
    schoolId: string;
    planKey: string;
    reference: string;
    amountKobo?: number;
    customerCode?: string;
  }): Promise<Result<{ applied: boolean }>> {
    const plan = planByKey(args.planKey);
    const amount = args.amountKobo != null ? args.amountKobo / 100 : plan?.amount ?? null;

    // Idempotency guard — record the reference before doing anything.
    const rec = await billingRepository.recordPaymentEventViaAdmin({
      schoolId: args.schoolId,
      reference: args.reference,
      eventType: "charge.success",
      amount,
    });
    if (rec.error) {
      if (rec.error.code === "23505") {
        logger.info("billing.payment_duplicate_ignored", { schoolId: args.schoolId, reference: args.reference });
        return ok({ applied: false }); // already applied — not an error
      }
      return err("INTERNAL", rec.error.message);
    }

    // Apply. If any write fails, undo the marker so a retry re-applies cleanly.
    const up = await billingRepository.upsertViaAdmin(args.schoolId, {
      plan: args.planKey,
      status: "active",
      provider: "paystack",
      customer_code: args.customerCode ?? null,
      amount,
      currency: plan?.currency ?? "NGN",
      current_period_end: periodEnd(plan?.interval ?? "annually"),
      last_payment_at: new Date().toISOString(),
    });
    if (up.error) {
      await billingRepository.deletePaymentEventViaAdmin(args.reference);
      return err("INTERNAL", up.error.message);
    }
    // Promote the school out of trial → active (entitlement then reads the active period).
    const act = await billingRepository.setSchoolActiveViaAdmin(args.schoolId);
    if (act.error) {
      await billingRepository.deletePaymentEventViaAdmin(args.reference);
      return err("INTERNAL", act.error.message);
    }
    await auditService.record({
      schoolId: args.schoolId,
      actorId: args.schoolId, // system/webhook actor; no user
      action: "billing.payment_succeeded",
      entityType: "subscription",
      entityId: args.schoolId,
      metadata: { plan: args.planKey, amountKobo: args.amountKobo ?? null, reference: args.reference },
    });
    logger.info("billing.payment_applied", { schoolId: args.schoolId, plan: args.planKey, reference: args.reference });
    return ok({ applied: true });
  },

  /**
   * Handle a verified Paystack webhook event. Returns ok:false on a genuine
   * processing failure so the route can answer non-2xx and Paystack retries.
   */
  async handleWebhookEvent(event: { event?: string; data?: Record<string, unknown> }): Promise<{ ok: boolean; handled: string }> {
    const type = event.event ?? "";
    const data = event.data ?? {};
    const metadata = (data.metadata as Record<string, unknown>) ?? {};
    const schoolId = metadata.school_id as string | undefined;
    const planKey = (metadata.plan as string | undefined) ?? "standard";

    if (type === "charge.success" && schoolId) {
      const reference = data.reference as string | undefined;
      if (!reference) return { ok: false, handled: "charge.success (missing reference)" };
      const customer = (data.customer as { customer_code?: string } | undefined)?.customer_code;
      const res = await this.applyPayment({
        schoolId,
        planKey,
        reference,
        amountKobo: data.amount as number | undefined,
        customerCode: customer,
      });
      if (!res.ok) return { ok: false, handled: `charge.success (${res.error.message})` };
      return { ok: true, handled: res.data.applied ? "charge.success" : "charge.success (duplicate)" };
    }

    if ((type === "subscription.disable" || type === "invoice.payment_failed") && schoolId) {
      // Idempotent on its own (sets a fixed status), but still surface DB errors.
      const up = await billingRepository.upsertViaAdmin(schoolId, {
        status: type === "subscription.disable" ? "canceled" : "past_due",
      });
      if (up.error) return { ok: false, handled: `${type} (${up.error.message})` };
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
    const applied = await this.applyPayment({
      schoolId,
      planKey: (v.metadata?.plan as string | undefined) ?? "standard",
      reference, // dedupes against the webhook applying the same transaction
      amountKobo: v.amountKobo,
      customerCode: v.customerCode,
    });
    if (!applied.ok) return applied;
    return ok({ status: "success" });
  },
};
