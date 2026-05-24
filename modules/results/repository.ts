import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { SubjectResult } from "@/lib/result-engine";

export interface TermResultRow {
  enrollmentId: string;
  classId: string;
  termId: string;
  subjectsCount: number;
  totalObtainable: number;
  totalObtained: number;
  average: number | null;
  classPosition: number | null;
  classSize: number;
}

/**
 * Data access for results. Loads engine inputs and persists outputs via upsert
 * (idempotent — recompute never duplicates, thanks to the full unique indexes in
 * migration 08). Tenant-scoped; RLS enforced.
 */
export const resultsRepository = {
  async getCurrentTerm(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name, session_id")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async listClassesLite(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("grade_order", { ascending: true })
      .order("name", { ascending: true });
  },

  async listSubjectsLite(schoolId: string) {
    const sb = await createClient();
    return sb.from("subjects").select("id, name").eq("school_id", schoolId).is("deleted_at", null);
  },

  async listClassSubjects(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .select("id, subject_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .eq("is_active", true)
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

  /** All scores for a set of class-subjects in one round-trip (keyed by subject). */
  async loadScoresForClassSubjects(schoolId: string, classSubjectIds: string[], termId: string) {
    const sb = await createClient();
    return sb
      .from("scores")
      .select("class_subject_id, enrollment_id, assessment_component_id, score, is_absent, is_exempt")
      .eq("school_id", schoolId)
      .in("class_subject_id", classSubjectIds.length ? classSubjectIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  /**
   * Bulk-upsert computed subject results for the WHOLE class in one statement.
   * Each row already carries its class_subject_id + subject_id, so all subjects
   * persist together rather than one round-trip per subject.
   */
  async upsertSubjectResults(
    schoolId: string,
    termId: string,
    subjectCount: number,
    results: (SubjectResult & { classSubjectId: string; subjectId: string })[],
    configSnapshot: unknown,
  ) {
    const sb = await createClient();
    if (results.length === 0) return { error: null };
    const now = new Date().toISOString();
    const rows = results.map((r) => ({
      school_id: schoolId,
      enrollment_id: r.studentRef,
      class_subject_id: r.classSubjectId,
      subject_id: r.subjectId,
      term_id: termId,
      ca_total: r.caTotal,
      exam_score: r.examScore,
      total: r.total,
      grade: r.grade,
      grade_point: r.gradePoint,
      remark: r.remark,
      subject_position: r.subjectPosition,
      subject_count: subjectCount,
      is_absent: r.isAbsent,
      config_snapshot: configSnapshot as Json,
      computed_at: now,
      status: "computed" as const,
    }));
    return sb.from("results").upsert(rows, {
      onConflict: "school_id,enrollment_id,class_subject_id,term_id",
    });
  },

  async upsertTermResults(schoolId: string, rows: TermResultRow[], configSnapshot: unknown) {
    const sb = await createClient();
    const now = new Date().toISOString();
    return sb.from("term_results").upsert(
      rows.map((r) => ({
        school_id: schoolId,
        enrollment_id: r.enrollmentId,
        class_id: r.classId,
        term_id: r.termId,
        subjects_count: r.subjectsCount,
        total_obtainable: r.totalObtainable,
        total_obtained: r.totalObtained,
        average: r.average,
        class_position: r.classPosition,
        class_size: r.classSize,
        config_snapshot: configSnapshot as Json,
        computed_at: now,
        status: "computed" as const,
      })),
      { onConflict: "school_id,enrollment_id,term_id" },
    );
  },

  // ── broadsheet reads ────────────────────────────────────────────────────────
  async loadClassResults(schoolId: string, classSubjectIds: string[], termId: string) {
    const sb = await createClient();
    return sb
      .from("results")
      .select("enrollment_id, subject_id, total, grade")
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .in("class_subject_id", classSubjectIds.length ? classSubjectIds : ["00000000-0000-0000-0000-000000000000"]);
  },

  async loadTermResults(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("term_results")
      .select("enrollment_id, average, class_position, class_size")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },
};
