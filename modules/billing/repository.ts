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
};
