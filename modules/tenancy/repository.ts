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
};
