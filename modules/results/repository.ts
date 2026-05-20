import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SubjectResult } from "@/lib/result-engine";

/**
 * Data access for results. Loads the engine's inputs (raw scores, roster) and
 * persists computed outputs via upsert (idempotent — recompute never
 * duplicates). Tenant-scoped; RLS enforced.
 */
export const resultsRepository = {
  /** Raw scores for one class-subject in a term, grouped-ready for the engine. */
  async loadScores(schoolId: string, classSubjectId: string, termId: string) {
    const supabase = await createClient();
    return supabase
      .from("scores")
      .select("enrollment_id, assessment_component_id, score, is_absent, is_exempt")
      .eq("school_id", schoolId)
      .eq("class_subject_id", classSubjectId)
      .eq("term_id", termId);
  },

  /** Upsert computed subject results on the natural unique key (idempotent). */
  async upsertSubjectResults(
    schoolId: string,
    classSubjectId: string,
    termId: string,
    subjectId: string,
    results: SubjectResult[],
    configSnapshot: unknown,
  ) {
    const supabase = await createClient();
    const rows = results.map((r) => ({
      school_id: schoolId,
      enrollment_id: r.studentRef,
      class_subject_id: classSubjectId,
      subject_id: subjectId,
      term_id: termId,
      ca_total: r.caTotal,
      exam_score: r.examScore,
      total: r.total,
      grade: r.grade,
      grade_point: r.gradePoint,
      remark: r.remark,
      subject_position: r.subjectPosition,
      is_absent: r.isAbsent,
      config_snapshot: configSnapshot,
      computed_at: new Date().toISOString(),
      status: "computed",
    }));

    return supabase
      .from("results")
      .upsert(rows, {
        onConflict: "school_id,enrollment_id,class_subject_id,term_id",
      });
  },
};
