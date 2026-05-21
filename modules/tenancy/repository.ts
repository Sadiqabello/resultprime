import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Tenant lookups. `getBySlug` powers subdomain → school resolution (Phase 2)
 * and should be cached (slow-changing). Settings drive branding & policy.
 */
export const tenancyRepository = {
  async getBySlug(slug: string) {
    const supabase = await createClient();
    return supabase.from("schools").select("*").eq("slug", slug).single();
  },

  async getSettings(schoolId: string) {
    const supabase = await createClient();
    return supabase
      .from("school_settings")
      .select("*")
      .eq("school_id", schoolId)
      .single();
  },

  /** The current user's own school (name + access status). RLS-scoped. */
  async getSchool(schoolId: string) {
    const supabase = await createClient();
    return supabase
      .from("schools")
      .select("id, name, status")
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
