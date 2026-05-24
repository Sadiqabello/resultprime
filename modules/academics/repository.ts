import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateClassInput,
  CreateSessionInput,
  CreateSubjectInput,
} from "./schema";

/**
 * Academics data access (sessions, terms, classes, subjects). Tenant-scoped;
 * writes are additionally gated by RLS to academics managers. The "set current"
 * helpers unset siblings first so the partial-unique `is_current` index never
 * sees two current rows at once.
 */
export const academicsRepository = {
  // ── sessions & terms ──────────────────────────────────────────────────────
  async listSessions(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("sessions")
      .select("id, name, is_current, starts_on, ends_on, terms(id, name, sequence, is_current)")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
  },

  async countSessions(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null);
  },

  async insertSession(schoolId: string, input: CreateSessionInput, isCurrent: boolean) {
    const sb = await createClient();
    return sb
      .from("sessions")
      .insert({
        school_id: schoolId,
        name: input.name,
        starts_on: input.startsOn ?? null,
        ends_on: input.endsOn ?? null,
        is_current: isCurrent,
      })
      .select("id")
      .single();
  },

  async insertTerms(
    schoolId: string,
    sessionId: string,
    terms: { name: string; sequence: number; isCurrent: boolean }[],
  ) {
    const sb = await createClient();
    return sb.from("terms").insert(
      terms.map((t) => ({
        school_id: schoolId,
        session_id: sessionId,
        name: t.name,
        sequence: t.sequence,
        is_current: t.isCurrent,
      })),
    );
  },

  async getTerm(schoolId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, session_id, sequence")
      .eq("school_id", schoolId)
      .eq("id", termId)
      .single();
  },

  async clearCurrentSessions(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("sessions")
      .update({ is_current: false })
      .eq("school_id", schoolId)
      .eq("is_current", true);
  },

  async markSessionCurrent(schoolId: string, sessionId: string) {
    const sb = await createClient();
    return sb.from("sessions").update({ is_current: true }).eq("school_id", schoolId).eq("id", sessionId);
  },

  async clearCurrentTerms(schoolId: string) {
    const sb = await createClient();
    return sb.from("terms").update({ is_current: false }).eq("school_id", schoolId).eq("is_current", true);
  },

  async markTermCurrent(schoolId: string, termId: string) {
    const sb = await createClient();
    return sb.from("terms").update({ is_current: true }).eq("school_id", schoolId).eq("id", termId);
  },

  async markSessionTermCurrent(schoolId: string, sessionId: string, sequence: number) {
    const sb = await createClient();
    return sb
      .from("terms")
      .update({ is_current: true })
      .eq("school_id", schoolId)
      .eq("session_id", sessionId)
      .eq("sequence", sequence);
  },

  // ── classes ───────────────────────────────────────────────────────────────
  async listClasses(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, level, arm, grade_order")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("grade_order", { ascending: true })
      .order("name", { ascending: true });
  },

  async insertClass(schoolId: string, input: CreateClassInput, _userId: string) {
    const sb = await createClient();
    // NB: the classes table has no created_by/updated_by columns (unlike
    // students) — writing them would be rejected by PostgREST at runtime.
    return sb.from("classes").insert({
      school_id: schoolId,
      name: input.name,
      level: input.level,
      arm: input.arm ?? null,
      grade_order: input.gradeOrder,
    });
  },

  async softDeleteClass(schoolId: string, id: string, _userId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("id", id);
  },

  // ── subjects ──────────────────────────────────────────────────────────────
  async listSubjects(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("subjects")
      .select("id, name, code, category")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("name", { ascending: true });
  },

  async insertSubject(schoolId: string, input: CreateSubjectInput) {
    const sb = await createClient();
    return sb.from("subjects").insert({
      school_id: schoolId,
      name: input.name,
      code: input.code.toUpperCase(),
      category: input.category,
    });
  },

  async softDeleteSubject(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("subjects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("id", id);
  },

  // ── class-subject assignment ────────────────────────────────────────────────
  async getClassById(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, level, arm")
      .eq("school_id", schoolId)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
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

  /** Teaching staff who have a login — candidates for the teacher picker. */
  async listTeachers(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("staff")
      .select("user_id, full_name")
      .eq("school_id", schoolId)
      .not("user_id", "is", null)
      .is("deleted_at", null)
      .order("full_name", { ascending: true });
  },

  async listClassSubjects(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .select("id, subject_id, teacher_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  async insertClassSubject(
    schoolId: string,
    args: { classId: string; subjectId: string; termId: string; teacherId: string | null },
  ) {
    const sb = await createClient();
    return sb.from("class_subjects").insert({
      school_id: schoolId,
      class_id: args.classId,
      subject_id: args.subjectId,
      term_id: args.termId,
      teacher_id: args.teacherId,
      is_active: true,
    });
  },

  async updateClassSubjectTeacher(schoolId: string, id: string, teacherId: string | null) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .update({ teacher_id: teacherId, is_active: true })
      .eq("school_id", schoolId)
      .eq("id", id);
  },

  async softDeleteClassSubject(schoolId: string, id: string) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("id", id);
  },
};
