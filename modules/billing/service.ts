import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { auditService } from "@/modules/audit/service";
import {
  PRICE_PER_STUDENT,
  MAX_STUDENTS_PURCHASE,
  isBillingPeriod,
  priceFor,
  studentCap,
  type BillingPeriod,
} from "@/config/plans";
import { initializeTransaction, paystackConfigured, verifyTransaction } from "@/lib/paystack";
import { billingRepository } from "./repository";

export interface BillingView {
  schoolName: string;
  trialEndsAt: string | null;
  paymentsConfigured: boolean;
  /** Per-student rates (NGN) so the page can render the purchase form. */
  pricePerStudent: Record<BillingPeriod, number>;
  /** Active students now vs the cap they can hold (paid-for, else the trial cap). */
  studentsUsed: number;
  studentCap: number;
  subscription: {
    /** "term" | "session" once paid; "trial" before that. */
    plan: string;
    status: string;
    amount: number | null;
    currency: string;
    currentPeriodEnd: string | null;
    studentsPaidFor: number | null;
  } | null;
}

/** One subscription period from now: a term ≈ 120 days, a session ≈ 1 year (3 terms). */
function periodEnd(period: BillingPeriod): string {
  const d = new Date();
  if (period === "session") d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 120);
  return d.toISOString();
}

export const billingService = {
  async getBilling(ctx: AuthContext): Promise<Result<BillingView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const [{ data: sub }, { data: school }, { count }] = await Promise.all([
      billingRepository.getBySchool(ctx.schoolId),
      billingRepository.getSchool(ctx.schoolId),
      billingRepository.countActiveStudents(ctx.schoolId),
    ]);
    const studentsPaidFor = (sub?.students_paid_for as number | null) ?? null;
    return ok({
      schoolName: (school?.name as string) ?? "Your school",
      trialEndsAt: (school?.trial_ends_at as string | null) ?? null,
      paymentsConfigured: paystackConfigured(),
      pricePerStudent: PRICE_PER_STUDENT,
      studentsUsed: count ?? 0,
      studentCap: studentCap(studentsPaidFor),
      subscription: sub
        ? {
            plan: sub.plan as string,
            status: sub.status as string,
            amount: (sub.amount as number | null) ?? null,
            currency: (sub.currency as string) ?? "NGN",
            currentPeriodEnd: (sub.current_period_end as string | null) ?? null,
            studentsPaidFor,
          }
        : null,
    });
  },

  /**
   * Start a Paystack checkout to pay for `quantity` student slots over a `period`
   * (term or session). The quantity becomes the school's student quota once paid.
   * Returns the authorization URL to redirect to.
   */
  async startCheckout(
    ctx: AuthContext,
    args: { period: BillingPeriod; quantity: number },
  ): Promise<Result<{ authorizationUrl: string }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "school.configure")) return err("FORBIDDEN", "Only a school admin can manage billing.");
    if (!paystackConfigured()) return err("CONFLICT", "Payments aren't configured yet (PAYSTACK_SECRET_KEY).");

    const { period, quantity } = args;
    if (!isBillingPeriod(period)) return err("VALIDATION", "Choose a billing period (term or session).");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_STUDENTS_PURCHASE) {
      return err("VALIDATION", `Enter a number of students between 1 and ${MAX_STUDENTS_PURCHASE.toLocaleString()}.`);
    }
    // Can't buy fewer slots than the roster you already have.
    const { count } = await billingRepository.countActiveStudents(ctx.schoolId);
    const current = count ?? 0;
    if (quantity < current) {
      return err("VALIDATION", `You already have ${current} students — buy at least ${current} slots.`);
    }

    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data: school } = await billingRepository.getSchool(ctx.schoolId);
    const email = (school?.email as string) || user?.email;
    if (!email) return err("CONFLICT", "Add a billing email to your school profile first.");

    const reference = `sub_${ctx.schoolId}_${Date.now()}`;
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const res = await initializeTransaction({
      email,
      amountKobo: Math.round(priceFor(period, quantity) * 100),
      reference,
      callbackUrl: `${base}/subscription/callback`,
      metadata: { school_id: ctx.schoolId, period, quantity },
    });
    if (!res.ok || !res.authorizationUrl) return err("INTERNAL", res.error ?? "Could not start checkout.");
    logger.info("billing.checkout_started", { schoolId: ctx.schoolId, period, quantity, reference });
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
    period: BillingPeriod;
    /** The quantity the school chose at checkout (from metadata); used as a fallback. */
    quantity?: number;
    reference: string;
    amountKobo?: number;
    customerCode?: string;
  }): Promise<Result<{ applied: boolean }>> {
    const period: BillingPeriod = isBillingPeriod(args.period) ? args.period : "session";
    const amount = args.amountKobo != null ? args.amountKobo / 100 : null;

    // Entitlement is granted on money ACTUALLY received, not on a metadata field a
    // client could tamper with: slots = amount paid ÷ the per-student rate. Fall back
    // to the checkout quantity only when the charged amount is unavailable.
    const studentsPaidFor =
      amount != null ? Math.max(1, Math.round(amount / PRICE_PER_STUDENT[period])) : args.quantity ?? null;

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
      plan: period,
      status: "active",
      provider: "paystack",
      customer_code: args.customerCode ?? null,
      amount,
      currency: "NGN",
      current_period_end: periodEnd(period),
      students_paid_for: studentsPaidFor,
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
      metadata: { period, studentsPaidFor, amountKobo: args.amountKobo ?? null, reference: args.reference },
    });
    logger.info("billing.payment_applied", { schoolId: args.schoolId, period, studentsPaidFor, reference: args.reference });
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
    const period = (metadata.period as BillingPeriod | undefined) ?? "session";
    const quantity = Number(metadata.quantity) || undefined;

    if (type === "charge.success" && schoolId) {
      const reference = data.reference as string | undefined;
      if (!reference) return { ok: false, handled: "charge.success (missing reference)" };
      const customer = (data.customer as { customer_code?: string } | undefined)?.customer_code;
      const res = await this.applyPayment({
        schoolId,
        period,
        quantity,
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
      period: (v.metadata?.period as BillingPeriod | undefined) ?? "session",
      quantity: Number(v.metadata?.quantity) || undefined,
      reference, // dedupes against the webhook applying the same transaction
      amountKobo: v.amountKobo,
      customerCode: v.customerCode,
    });
    if (!applied.ok) return applied;
    return ok({ status: "success" });
  },
};
