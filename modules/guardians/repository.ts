import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Guardian data access. Writes are RLS-gated to can_manage_academics. */
export const guardiansRepository = {
  async getStudent(schoolId: string, studentId: string) {
    const sb = await createClient();
    return sb
      .from("students")
      .select("id, first_name, last_name, other_names, admission_no, user_id")
      .eq("school_id", schoolId)
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async listForStudent(schoolId: string, studentId: string) {
    const sb = await createClient();
    const { data: links } = await sb
      .from("student_guardians")
      .select("guardian_id, relationship, is_primary")
      .eq("school_id", schoolId)
      .eq("student_id", studentId);
    const ids = (links ?? []).map((l) => l.guardian_id as string);
    if (ids.length === 0) return { guardians: [], links: links ?? [] };
    const { data: guardians } = await sb
      .from("guardians")
      .select("id, full_name, email, phone, user_id")
      .eq("school_id", schoolId)
      .in("id", ids)
      .is("deleted_at", null);
    return { guardians: guardians ?? [], links: links ?? [] };
  },

  async insertGuardian(schoolId: string, fields: { full_name: string; email?: string; phone?: string }) {
    const sb = await createClient();
    return sb
      .from("guardians")
      .insert({ school_id: schoolId, full_name: fields.full_name, email: fields.email ?? null, phone: fields.phone ?? null })
      .select("id")
      .single();
  },

  async link(schoolId: string, studentId: string, guardianId: string, relationship: string | null, isPrimary: boolean) {
    const sb = await createClient();
    return sb
      .from("student_guardians")
      .insert({ school_id: schoolId, student_id: studentId, guardian_id: guardianId, relationship, is_primary: isPrimary });
  },

  async setUserId(schoolId: string, guardianId: string, userId: string) {
    const sb = await createClient();
    return sb.from("guardians").update({ user_id: userId }).eq("school_id", schoolId).eq("id", guardianId);
  },

  async deleteGuardian(schoolId: string, guardianId: string) {
    const sb = await createClient();
    return sb.from("guardians").delete().eq("school_id", schoolId).eq("id", guardianId);
  },
};
