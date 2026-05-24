import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";

/**
 * Data access for bulk promotion. Reads cumulative_results (the decisions) and
 * writes the next session's enrollments + students.current_class_id. Tenant
 * scoped; RLS requires can_manage_academics() for the enrollment/student writes.
 */
export const promotionRepository = {
  async getCurrentTerm(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, session_id")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async getTerm(schoolId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name, session_id")
      .eq("school_id", schoolId)
      .eq("id", termId)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async getSession(schoolId: string, sessionId: string) {
    const sb = await createClient();
    return sb.from("sessions").select("id, name").eq("school_id", schoolId).eq("id", sessionId).maybeSingle();
  },

  async listSessions(schoolId: string) {
    const sb = await createClient();
    return sb.from("sessions").select("id, name").eq("school_id", schoolId).is("deleted_at", null);
  },

  async listTerms(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name, session_id, sequence")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("sequence", { ascending: true });
  },

  async listClassesLite(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm, next_class_id")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("grade_order", { ascending: true });
  },

  async listCumulative(schoolId: string, classId: string, sessionId: string) {
    const sb = await createClient();
    return sb
      .from("cumulative_results")
      .select("student_id, promotion_status, next_class_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("session_id", sessionId)
      .is("deleted_at", null);
  },

  async loadStudents(schoolId: string, ids: string[]) {
    const sb = await createClient();
    return sb
      .from("students")
      .select("id, first_name, last_name, other_names, admission_no, status")
      .eq("school_id", schoolId)
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  },

  /** Existing enrollments for the target term (to stay idempotent without upsert). */
  async listEnrollmentsForTerm(schoolId: string, termId: string, studentIds: string[]) {
    const sb = await createClient();
    return sb
      .from("enrollments")
      .select("id, student_id, class_id")
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"])
      .is("deleted_at", null);
  },

  async insertEnrollments(rows: Record<string, unknown>[]) {
    const sb = await createClient();
    if (rows.length === 0) return { error: null };
    return sb.from("enrollments").insert(rows as TablesInsert<"enrollments">[]);
  },

  async updateEnrollmentClass(schoolId: string, id: string, classId: string) {
    const sb = await createClient();
    return sb
      .from("enrollments")
      .update({ class_id: classId, status: "active" })
      .eq("school_id", schoolId)
      .eq("id", id);
  },

  async updateStudentClass(schoolId: string, studentId: string, classId: string) {
    const sb = await createClient();
    return sb.from("students").update({ current_class_id: classId }).eq("school_id", schoolId).eq("id", studentId);
  },

  async setStudentGraduated(schoolId: string, studentId: string) {
    const sb = await createClient();
    return sb.from("students").update({ status: "graduated" }).eq("school_id", schoolId).eq("id", studentId);
  },
};
