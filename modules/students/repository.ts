import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CreateStudentInput } from "./schema";

/**
 * Data access for students + their enrolment. Tenant-scoped; RLS-enforced.
 * `current_class_id` is a convenience cache; the enrolment row is the truth
 * scores attach to.
 */
export const studentsRepository = {
  async list(schoolId: string, opts: { classId?: string; limit?: number } = {}) {
    const sb = await createClient();
    let query = sb
      .from("students")
      .select("id, admission_no, first_name, last_name, other_names, gender, current_class_id, status")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(opts.limit ?? 200);
    if (opts.classId) query = query.eq("current_class_id", opts.classId);
    return query;
  },

  /** Lightweight class list for filters + the enrol dropdown (staff-readable via RLS). */
  async listClasses(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("grade_order", { ascending: true })
      .order("name", { ascending: true });
  },

  /** Current term + its session — needed to create an enrolment. */
  async getCurrentTermContext(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, session_id")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async create(schoolId: string, input: CreateStudentInput, createdBy: string) {
    const sb = await createClient();
    return sb
      .from("students")
      .insert({
        school_id: schoolId,
        admission_no: input.admissionNo,
        first_name: input.firstName,
        last_name: input.lastName,
        other_names: input.otherNames ?? null,
        gender: input.gender ?? null,
        date_of_birth: input.dateOfBirth ?? null,
        current_class_id: input.classId,
        created_by: createdBy,
      })
      .select("id")
      .single();
  },

  async insertEnrollment(
    schoolId: string,
    args: { studentId: string; classId: string; sessionId: string; termId: string },
  ) {
    const sb = await createClient();
    return sb.from("enrollments").insert({
      school_id: schoolId,
      student_id: args.studentId,
      class_id: args.classId,
      session_id: args.sessionId,
      term_id: args.termId,
    });
  },

  async softDelete(schoolId: string, id: string, deletedBy: string) {
    const sb = await createClient();
    return sb
      .from("students")
      .update({ deleted_at: new Date().toISOString(), updated_by: deletedBy })
      .eq("school_id", schoolId)
      .eq("id", id);
  },

  async hardDelete(schoolId: string, id: string) {
    const sb = await createClient();
    return sb.from("students").delete().eq("school_id", schoolId).eq("id", id);
  },
};
