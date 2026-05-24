import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tenant lookups. `getPublicBySlug` powers subdomain → school resolution and the
 * branded (unauthenticated) login page, so it uses the service-role client and
 * returns only public branding fields. Settings drive branding & policy.
 */
export const tenancyRepository = {
  async getBySlug(slug: string) {
    const supabase = await createClient();
    return supabase.from("schools").select("*").eq("slug", slug).single();
  },

  /**
   * Public branding for a subdomain — no auth (the login page is unauthenticated,
   * and RLS would block reading another tenant). Service-role; safe fields only.
   */
  async getPublicBySlug(slug: string) {
    const admin = createAdminClient();
    const { data: school } = await admin
      .from("schools")
      .select("id, name, slug, status")
      .eq("slug", slug)
      .maybeSingle();
    if (!school) return null;
    const { data: settings } = await admin
      .from("school_settings")
      .select("logo_url, primary_color")
      .eq("school_id", school.id)
      .maybeSingle();
    return { ...school, logo_url: settings?.logo_url ?? null, primary_color: settings?.primary_color ?? null };
  },

  async getSettings(schoolId: string) {
    const supabase = await createClient();
    return supabase
      .from("school_settings")
      .select("*")
      .eq("school_id", schoolId)
      .single();
  },

  /** The current user's own school + trial/subscription for entitlement. RLS-scoped. */
  async getSchool(schoolId: string) {
    const supabase = await createClient();
    return supabase
      .from("schools")
      .select("id, name, slug, status, trial_ends_at, subscriptions(status, current_period_end)")
      .eq("id", schoolId)
      .maybeSingle();
  },

  /** Update school name (RLS: school_admin via schools_update). */
  async updateSchoolName(schoolId: string, name: string) {
    const supabase = await createClient();
    return supabase.from("schools").update({ name }).eq("id", schoolId);
  },

  /** Upsert branding/policy settings (RLS: school_admin via school_settings_*). */
  async upsertSettings(schoolId: string, fields: Record<string, unknown>) {
    const supabase = await createClient();
    return supabase
      .from("school_settings")
      .upsert({ school_id: schoolId, ...fields }, { onConflict: "school_id" });
  },
};
