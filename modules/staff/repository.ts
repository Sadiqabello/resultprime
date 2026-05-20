import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AddStaffInput } from "./schema";

/** Staff data access. Role display joins through user_roles → roles in a second query. */
export const staffRepository = {
  async list(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("staff")
      .select("id, full_name, staff_no, phone, qualification, status, is_teaching, user_id")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("full_name", { ascending: true });
  },

  /** user_id → [role keys] for everyone in the school (to label staff). */
  async listUserRoles(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("user_roles")
      .select("user_id, roles(key)")
      .eq("school_id", schoolId);
  },

  async getRoleIdByKey(roleKey: string) {
    const sb = await createClient();
    const { data } = await sb
      .from("roles")
      .select("id")
      .is("school_id", null)
      .eq("key", roleKey)
      .maybeSingle();
    return (data?.id as string | undefined) ?? null;
  },

  async insert(schoolId: string, input: AddStaffInput, userId: string | null) {
    const sb = await createClient();
    return sb
      .from("staff")
      .insert({
        school_id: schoolId,
        user_id: userId,
        full_name: input.fullName,
        staff_no: input.staffNo,
        phone: input.phone ?? null,
        qualification: input.qualification ?? null,
        is_teaching: input.isTeaching,
      })
      .select("id")
      .single();
  },

  async insertUserRole(userId: string, roleId: string, schoolId: string) {
    const sb = await createClient();
    return sb
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleId, school_id: schoolId });
  },

  async softDelete(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("staff")
      .update({ deleted_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("id", id);
  },
};
