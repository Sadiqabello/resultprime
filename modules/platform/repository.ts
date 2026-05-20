import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Platform (cross-tenant) data access. Uses the SERVICE-ROLE client, which
 * BYPASSES RLS — so callers MUST gate on isSuperAdmin first (see service). This
 * is the one sanctioned cross-tenant surface (§4.6).
 */
export const platformRepository = {
  listSchools() {
    const a = createAdminClient();
    return a
      .from("schools")
      .select("id, name, slug, status, subscription_tier, trial_ends_at, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
  },

  listSchoolNames() {
    const a = createAdminClient();
    return a.from("schools").select("id, name");
  },

  insertSchool(name: string, slug: string) {
    const a = createAdminClient();
    return a.from("schools").insert({ name, slug, status: "trial" }).select("id").single();
  },

  insertSettings(schoolId: string) {
    const a = createAdminClient();
    return a.from("school_settings").insert({ school_id: schoolId });
  },

  deleteSchool(id: string) {
    const a = createAdminClient();
    return a.from("schools").delete().eq("id", id);
  },

  setStatus(id: string, status: string) {
    const a = createAdminClient();
    return a.from("schools").update({ status }).eq("id", id);
  },

  getSystemRoleId(key: string) {
    const a = createAdminClient();
    return a.from("roles").select("id").is("school_id", null).eq("key", key).maybeSingle();
  },

  insertUserRole(userId: string, roleId: string, schoolId: string) {
    const a = createAdminClient();
    return a
      .from("user_roles")
      .upsert({ user_id: userId, role_id: roleId, school_id: schoolId }, { onConflict: "user_id,role_id" });
  },

  listAudit(limit: number) {
    const a = createAdminClient();
    return a
      .from("audit_logs")
      .select("id, school_id, actor_role, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};
