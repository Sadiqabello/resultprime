import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Report-card data access. Staff reads go through the user client (RLS). Public
 * QR verification uses the service-role client because the visitor is anonymous
 * — it returns only a PUBLISHED summary, never scores (§11.6).
 */
export const reportsRepository = {
  async getEnrollment(schoolId: string, enrollmentId: string) {
    const sb = await createClient();
    return sb
      .from("enrollments")
      .select("id, student_id, class_id, term_id")
      .eq("school_id", schoolId)
      .eq("id", enrollmentId)
      .maybeSingle();
  },

  async getTermResult(schoolId: string, enrollmentId: string) {
    const sb = await createClient();
    return sb
      .from("term_results")
      .select(
        "id, average, class_position, class_size, subjects_count, total_obtained, total_obtainable, grade_overall, class_teacher_remark, principal_remark, attendance_present, attendance_total, status, published_at",
      )
      .eq("school_id", schoolId)
      .eq("enrollment_id", enrollmentId)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async getResults(schoolId: string, enrollmentId: string) {
    const sb = await createClient();
    return sb
      .from("results")
      .select("subject_id, ca_total, exam_score, total, grade, remark, subject_position, subject_count")
      .eq("school_id", schoolId)
      .eq("enrollment_id", enrollmentId)
      .is("deleted_at", null);
  },

  async getStudent(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("students")
      .select("first_name, last_name, other_names, admission_no")
      .eq("school_id", schoolId)
      .eq("id", id)
      .maybeSingle();
  },

  async getClass(schoolId: string, id: string) {
    const sb = await createClient();
    return sb.from("classes").select("name, arm").eq("school_id", schoolId).eq("id", id).maybeSingle();
  },

  async getTerm(schoolId: string, id: string) {
    const sb = await createClient();
    return sb.from("terms").select("name, session_id").eq("school_id", schoolId).eq("id", id).maybeSingle();
  },

  async getSession(schoolId: string, id: string) {
    const sb = await createClient();
    return sb.from("sessions").select("name").eq("school_id", schoolId).eq("id", id).maybeSingle();
  },

  async getSchool(schoolId: string) {
    const sb = await createClient();
    return sb.from("schools").select("name").eq("id", schoolId).maybeSingle();
  },

  async getSettings(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("school_settings")
      .select("logo_url, primary_color")
      .eq("school_id", schoolId)
      .maybeSingle();
  },

  async listSubjectsLite(schoolId: string) {
    const sb = await createClient();
    return sb.from("subjects").select("id, name").eq("school_id", schoolId).is("deleted_at", null);
  },

  async getCurrentTerm(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async getClassMeta(schoolId: string, classId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm, form_teacher_id")
      .eq("school_id", schoolId)
      .eq("id", classId)
      .is("deleted_at", null)
      .maybeSingle();
  },

  /** Term-result extras (remarks/attendance) for a class, for the editor. */
  async listClassExtras(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("term_results")
      .select(
        "enrollment_id, class_teacher_remark, principal_remark, attendance_present, attendance_total, average, class_position",
      )
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  async loadEnrollments(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("enrollments")
      .select("id, student_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .eq("status", "active")
      .is("deleted_at", null);
  },

  async loadStudents(schoolId: string, ids: string[]) {
    const sb = await createClient();
    return sb
      .from("students")
      .select("id, first_name, last_name, other_names, admission_no")
      .eq("school_id", schoolId)
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  },

  /**
   * Update ONLY the remark/attendance columns of a term_result. Uses the
   * service-role client so form teachers (who lack `can_manage_results`) can
   * write report extras; the SERVICE enforces capability + form-teacher/role
   * scope + tenant before calling this, and only these columns are ever set.
   */
  async updateExtras(
    schoolId: string,
    enrollmentId: string,
    termId: string,
    fields: {
      class_teacher_remark: string | null;
      principal_remark: string | null;
      attendance_present: number | null;
      attendance_total: number | null;
    },
  ) {
    const admin = createAdminClient();
    return admin
      .from("term_results")
      .update(fields)
      .eq("school_id", schoolId)
      .eq("enrollment_id", enrollmentId)
      .eq("term_id", termId);
  },

  /** Public verification — service-role, published-only, summary fields only. */
  async verifyByCode(code: string) {
    const admin = createAdminClient();
    const { data: tr } = await admin
      .from("term_results")
      .select("enrollment_id, average, class_position, class_size, published_at, school_id, class_id, term_id")
      .eq("id", code)
      .eq("status", "published")
      .maybeSingle();
    if (!tr) return null;

    const [{ data: enr }, { data: cls }, { data: term }, { data: school }] = await Promise.all([
      admin.from("enrollments").select("student_id").eq("id", tr.enrollment_id).maybeSingle(),
      admin.from("classes").select("name, arm").eq("id", tr.class_id).maybeSingle(),
      admin.from("terms").select("name").eq("id", tr.term_id).maybeSingle(),
      admin.from("schools").select("name").eq("id", tr.school_id).maybeSingle(),
    ]);
    const { data: stud } = enr?.student_id
      ? await admin
          .from("students")
          .select("first_name, last_name, other_names")
          .eq("id", enr.student_id)
          .maybeSingle()
      : { data: null };

    return { tr, cls, term, school, stud };
  },
};
