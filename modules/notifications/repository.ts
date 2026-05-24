import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";

/**
 * Notification data access. Inserts are RLS-gated to school staff
 * (notifications_insert); reads/updates to the recipient themselves
 * (notifications_select / _update_own).
 */
export const notificationsRepository = {
  /** Recipients for a class's published results: students, guardians, form teacher. */
  async getClassMeta(schoolId: string, classId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm, form_teacher_id")
      .eq("school_id", schoolId)
      .eq("id", classId)
      .maybeSingle();
  },

  async studentUserIdsForClass(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    const { data: enr } = await sb
      .from("enrollments")
      .select("student_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .eq("status", "active")
      .is("deleted_at", null);
    const studentIds = (enr ?? []).map((e) => e.student_id as string);
    if (studentIds.length === 0) return { studentUserIds: [], studentIds };

    const { data: studs } = await sb
      .from("students")
      .select("id, user_id")
      .eq("school_id", schoolId)
      .in("id", studentIds);
    const studentUserIds = (studs ?? []).map((s) => s.user_id).filter((u): u is string => Boolean(u));
    return { studentUserIds, studentIds };
  },

  async guardianUserIdsForStudents(schoolId: string, studentIds: string[]) {
    if (studentIds.length === 0) return [];
    const sb = await createClient();
    const { data: links } = await sb
      .from("student_guardians")
      .select("guardian_id")
      .eq("school_id", schoolId)
      .in("student_id", studentIds);
    const guardianIds = [...new Set((links ?? []).map((l) => l.guardian_id as string))];
    if (guardianIds.length === 0) return [];
    const { data: guardians } = await sb.from("guardians").select("user_id").in("id", guardianIds);
    return (guardians ?? []).map((g) => g.user_id).filter((u): u is string => Boolean(u));
  },

  /** Email/phone for a set of users (RLS: staff may read users in their school). */
  async loadUserContacts(userIds: string[]) {
    const sb = await createClient();
    return sb
      .from("users")
      .select("id, email, phone")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  },

  async insertMany(rows: Record<string, unknown>[]) {
    const sb = await createClient();
    // Rows are built dynamically by the service from validated inputs; assert the
    // shape at this single DB boundary so callers keep their flexible payloads.
    return sb.from("notifications").insert(rows as TablesInsert<"notifications">[]);
  },

  async listForUser(userId: string, limit = 50) {
    const sb = await createClient();
    return sb
      .from("notifications")
      .select("id, type, payload, read_at, created_at")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
  },

  async unreadCount(userId: string) {
    const sb = await createClient();
    return sb
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .is("read_at", null);
  },

  async markRead(userId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("notifications")
      .update({ read_at: new Date().toISOString(), status: "read" })
      .eq("recipient_user_id", userId)
      .eq("id", id);
  },

  async markAllRead(userId: string) {
    const sb = await createClient();
    return sb
      .from("notifications")
      .update({ read_at: new Date().toISOString(), status: "read" })
      .eq("recipient_user_id", userId)
      .is("read_at", null);
  },
};
