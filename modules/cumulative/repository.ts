import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CumulativeRow {
  studentId: string;
  classId: string;
  sessionId: string;
  termsCount: number;
  cumulativeAverage: number | null;
  annualPosition: number | null;
  classSize: number;
  promotionStatus: string;
  nextClassId: string | null;
}

/** Data access for annual rollups. Reads term_results; writes cumulative_results. */
export const cumulativeRepository = {
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

  async getSession(schoolId: string, sessionId: string) {
    const sb = await createClient();
    return sb.from("sessions").select("id, name").eq("school_id", schoolId).eq("id", sessionId).maybeSingle();
  },

  async listSessionTerms(schoolId: string, sessionId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name, sequence")
      .eq("school_id", schoolId)
      .eq("session_id", sessionId)
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
      .order("grade_order", { ascending: true })
      .order("name", { ascending: true });
  },

  /** Enrollments in a class across the session's terms (student↔term map). */
  async listClassEnrollments(schoolId: string, classId: string, termIds: string[]) {
    const sb = await createClient();
    return sb
      .from("enrollments")
      .select("id, student_id, term_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .in("term_id", termIds.length ? termIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "active")
      .is("deleted_at", null);
  },

  /** Term results for a class across the session's terms. */
  async listClassTermResults(schoolId: string, classId: string, termIds: string[]) {
    const sb = await createClient();
    return sb
      .from("term_results")
      .select("enrollment_id, term_id, average")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .in("term_id", termIds.length ? termIds : ["00000000-0000-0000-0000-000000000000"])
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
   * Replace a class's annual rows for the session, idempotently. We delete the
   * affected students' existing session rows then insert fresh, rather than
   * ON CONFLICT — the natural-key index is partial (`where deleted_at is null`),
   * which PostgREST can't use as a conflict target, and an annual result is a
   * recomputable aggregate so wipe-and-reinsert is the cleanest recompute.
   */
  async upsertCumulative(schoolId: string, rows: CumulativeRow[], configSnapshot: unknown) {
    const sb = await createClient();
    if (rows.length === 0) return { error: null };
    const now = new Date().toISOString();
    const sessionId = rows[0]!.sessionId;
    const studentIds = rows.map((r) => r.studentId);

    const del = await sb
      .from("cumulative_results")
      .delete()
      .eq("school_id", schoolId)
      .eq("session_id", sessionId)
      .in("student_id", studentIds);
    if (del.error) return del;

    return sb.from("cumulative_results").insert(
      rows.map((r) => ({
        school_id: schoolId,
        student_id: r.studentId,
        class_id: r.classId,
        session_id: r.sessionId,
        terms_count: r.termsCount,
        cumulative_average: r.cumulativeAverage,
        annual_position: r.annualPosition,
        class_size: r.classSize,
        promotion_status: r.promotionStatus,
        next_class_id: r.nextClassId,
        config_snapshot: configSnapshot,
        computed_at: now,
        status: "computed",
      })),
    );
  },

  async listCumulative(schoolId: string, classId: string, sessionId: string) {
    const sb = await createClient();
    return sb
      .from("cumulative_results")
      .select("student_id, terms_count, cumulative_average, annual_position, class_size, promotion_status, next_class_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("session_id", sessionId)
      .is("deleted_at", null);
  },
};
