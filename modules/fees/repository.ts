import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SaveFeesInput } from "./schema";

/** Fee-status data access. Bursar/admin writes are RLS-gated to fees.manage. */
export const feesRepository = {
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

  async getSettings(schoolId: string) {
    const sb = await createClient();
    return sb.from("school_settings").select("fee_gating_enabled").eq("school_id", schoolId).maybeSingle();
  },

  async getClassMeta(schoolId: string, classId: string) {
    const sb = await createClient();
    return sb.from("classes").select("id, name, arm").eq("school_id", schoolId).eq("id", classId).maybeSingle();
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

  async listFeeStatus(schoolId: string, enrollmentIds: string[]) {
    const sb = await createClient();
    return sb
      .from("fee_status")
      .select("enrollment_id, status, note")
      .eq("school_id", schoolId)
      .in("enrollment_id", enrollmentIds.length ? enrollmentIds : ["00000000-0000-0000-0000-000000000000"]);
  },

  /** Upsert clearance rows (full unique index on school_id+enrollment_id). */
  async upsertFees(schoolId: string, termId: string, input: SaveFeesInput, updatedBy: string) {
    const sb = await createClient();
    return sb.from("fee_status").upsert(
      input.rows.map((r) => ({
        school_id: schoolId,
        enrollment_id: r.enrollmentId,
        term_id: termId,
        status: r.status,
        note: r.note || null,
        updated_by: updatedBy,
      })),
      { onConflict: "school_id,enrollment_id" },
    );
  },
};
