import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SaveScoresInput } from "./schema";

/** Score-sheet data access. Tenant-scoped; RLS enforces teacher/manager scope. */
export const scoresRepository = {
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

  async listClassSubjectsForTerm(
    schoolId: string,
    termId: string,
    opts: { teacherId?: string } = {},
  ) {
    const sb = await createClient();
    let q = sb
      .from("class_subjects")
      .select("id, class_id, subject_id, teacher_id")
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (opts.teacherId) q = q.eq("teacher_id", opts.teacherId);
    return q;
  },

  async getClassSubject(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .select("id, class_id, subject_id, term_id, teacher_id")
      .eq("school_id", schoolId)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async listClassesLite(schoolId: string) {
    const sb = await createClient();
    return sb.from("classes").select("id, name, arm").eq("school_id", schoolId).is("deleted_at", null);
  },

  async listSubjectsLite(schoolId: string) {
    const sb = await createClient();
    return sb.from("subjects").select("id, name").eq("school_id", schoolId).is("deleted_at", null);
  },

  async listTeacherNames(schoolId: string) {
    const sb = await createClient();
    return sb.from("staff").select("user_id, full_name").eq("school_id", schoolId).not("user_id", "is", null);
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

  async loadScores(schoolId: string, classSubjectId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("scores")
      .select("enrollment_id, assessment_component_id, score, is_absent")
      .eq("school_id", schoolId)
      .eq("class_subject_id", classSubjectId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  async getApprovalState(schoolId: string, classSubjectId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("approvals")
      .select("state")
      .eq("school_id", schoolId)
      .eq("subject_type", "class_subject_result")
      .eq("subject_id", classSubjectId)
      .eq("term_id", termId)
      .maybeSingle();
  },

  /** Upsert score cells (full unique index added in migration 08). Trigger logs history. */
  async upsertCells(schoolId: string, input: SaveScoresInput, enteredBy: string) {
    const sb = await createClient();
    const rows = input.cells.map((c) => ({
      school_id: schoolId,
      enrollment_id: c.enrollmentId,
      class_subject_id: input.classSubjectId,
      assessment_component_id: c.assessmentComponentId,
      term_id: input.termId,
      score: c.value,
      is_absent: c.isAbsent,
      is_exempt: c.isExempt,
      entered_by: enteredBy,
      status: "draft",
    }));
    return sb.from("scores").upsert(rows, {
      onConflict: "school_id,enrollment_id,class_subject_id,assessment_component_id,term_id",
    });
  },
};
