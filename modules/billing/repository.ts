import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Subscription data access. App reads are RLS-scoped; the webhook writes via service-role. */
export const billingRepository = {
  async getBySchool(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("subscriptions")
      .select("plan, status, amount, currency, current_period_end, last_payment_at")
      .eq("school_id", schoolId)
      .maybeSingle();
  },

  async getSchool(schoolId: string) {
    const sb = await createClient();
    return sb.from("schools").select("name, email, trial_ends_at").eq("id", schoolId).maybeSingle();
  },

  /** Upsert a subscription (service-role) — used by the webhook, which has no session. */
  async upsertViaAdmin(schoolId: string, fields: Record<string, unknown>) {
    const admin = createAdminClient();
    return admin
      .from("subscriptions")
      .upsert({ school_id: schoolId, ...fields }, { onConflict: "school_id" });
  },

  /**
   * Record a processed payment reference (service-role). The UNIQUE index on
   * (provider, reference) makes a repeat insert fail with 23505 — that's the
   * idempotency signal the apply path uses to skip an already-applied payment.
   */
  async recordPaymentEventViaAdmin(args: {
    schoolId: string | null;
    reference: string;
    eventType: string;
    amount: number | null;
    provider?: string;
  }) {
    const admin = createAdminClient();
    return admin.from("payment_events").insert({
      school_id: args.schoolId,
      provider: args.provider ?? "paystack",
      reference: args.reference,
      event_type: args.eventType,
      amount: args.amount,
    });
  },

  /** Undo an idempotency marker so a retry can re-apply (used when apply fails). */
  async deletePaymentEventViaAdmin(reference: string, provider = "paystack") {
    const admin = createAdminClient();
    return admin.from("payment_events").delete().eq("provider", provider).eq("reference", reference);
  },

  /** Promote the school to active on payment (service-role). Won't override a manual suspend/cancel. */
  async setSchoolActiveViaAdmin(schoolId: string) {
    const admin = createAdminClient();
    return admin
      .from("schools")
      .update({ status: "active" })
      .eq("id", schoolId)
      .in("status", ["trial", "active"]);
  },

  /** Schools whose trial/subscription needs a dunning reminder (service-role, cross-tenant). */
  async listForDunning() {
    const admin = createAdminClient();
    return admin
      .from("schools")
      .select("id, name, email, status, trial_ends_at, subscriptions(status, current_period_end)")
      .in("status", ["trial", "active"])
      .is("deleted_at", null);
  },
};
