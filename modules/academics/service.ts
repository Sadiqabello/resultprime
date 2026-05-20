import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import {
  createClassSchema,
  createSessionSchema,
  createSubjectSchema,
  saveAssignmentSchema,
  STANDARD_TERMS,
  type CreateClassInput,
  type CreateSessionInput,
  type CreateSubjectInput,
  type SaveAssignmentInput,
} from "./schema";
import { academicsRepository } from "./repository";

export interface TermView {
  id: string;
  name: string;
  sequence: number;
  isCurrent: boolean;
}
export interface SessionView {
  id: string;
  name: string;
  isCurrent: boolean;
  startsOn: string | null;
  endsOn: string | null;
  terms: TermView[];
}
export interface ClassView {
  id: string;
  name: string;
  level: string;
  arm: string | null;
  gradeOrder: number;
}
export interface SubjectView {
  id: string;
  name: string;
  code: string;
  category: string;
}
export interface TeacherOption {
  userId: string;
  fullName: string;
}
export interface AssignmentSubject {
  subjectId: string;
  name: string;
  code: string;
  offered: boolean;
  teacherId: string | null;
}
export interface ClassAssignmentView {
  klass: { id: string; name: string; level: string; arm: string | null };
  term: { id: string; name: string } | null;
  subjects: AssignmentSubject[];
  teachers: TeacherOption[];
}

function guard(ctx: AuthContext): Result<string> {
  if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
  if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
  return ok(ctx.schoolId);
}

export const academicsService = {
  // ── sessions & terms ──────────────────────────────────────────────────────
  async listSessions(ctx: AuthContext): Promise<Result<SessionView[]>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { data, error } = await academicsRepository.listSessions(g.data);
    if (error) return err("INTERNAL", error.message);
    const sessions: SessionView[] = (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      isCurrent: s.is_current,
      startsOn: s.starts_on,
      endsOn: s.ends_on,
      terms: (s.terms ?? [])
        .slice()
        .sort((a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence)
        .map((t: { id: string; name: string; sequence: number; is_current: boolean }) => ({
          id: t.id,
          name: t.name,
          sequence: t.sequence,
          isCurrent: t.is_current,
        })),
    }));
    return ok(sessions);
  },

  async createSession(ctx: AuthContext, input: CreateSessionInput): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const parsed = createSessionSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");

    // The very first session a school creates becomes the active one.
    const { count } = await academicsRepository.countSessions(g.data);
    const isFirst = (count ?? 0) === 0;

    const { data: session, error } = await academicsRepository.insertSession(
      g.data,
      parsed.data,
      isFirst,
    );
    if (error || !session) {
      if (error?.code === "23505") return err("CONFLICT", "A session with that name already exists.");
      return err("INTERNAL", error?.message ?? "Could not create session.");
    }

    const { error: termErr } = await academicsRepository.insertTerms(
      g.data,
      session.id as string,
      STANDARD_TERMS.map((t) => ({ ...t, isCurrent: isFirst && t.sequence === 1 })),
    );
    if (termErr) return err("INTERNAL", termErr.message);
    return ok(null);
  },

  /** Make a session active, and move the current term to that session's First term. */
  async setCurrentSession(ctx: AuthContext, sessionId: string): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    await academicsRepository.clearCurrentSessions(g.data);
    const { error } = await academicsRepository.markSessionCurrent(g.data, sessionId);
    if (error) return err("INTERNAL", error.message);
    await academicsRepository.clearCurrentTerms(g.data);
    await academicsRepository.markSessionTermCurrent(g.data, sessionId, 1);
    return ok(null);
  },

  /** Make a term active (and its session active, keeping the two consistent). */
  async setCurrentTerm(ctx: AuthContext, termId: string): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { data: term, error } = await academicsRepository.getTerm(g.data, termId);
    if (error || !term) return err("NOT_FOUND", "Term not found.");

    await academicsRepository.clearCurrentSessions(g.data);
    await academicsRepository.markSessionCurrent(g.data, term.session_id as string);
    await academicsRepository.clearCurrentTerms(g.data);
    const { error: e } = await academicsRepository.markTermCurrent(g.data, termId);
    if (e) return err("INTERNAL", e.message);
    return ok(null);
  },

  // ── classes ───────────────────────────────────────────────────────────────
  async listClasses(ctx: AuthContext): Promise<Result<ClassView[]>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { data, error } = await academicsRepository.listClasses(g.data);
    if (error) return err("INTERNAL", error.message);
    return ok(
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        arm: c.arm,
        gradeOrder: c.grade_order,
      })),
    );
  },

  async createClass(ctx: AuthContext, input: CreateClassInput): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const parsed = createClassSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");
    const { error } = await academicsRepository.insertClass(g.data, parsed.data, ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  async removeClass(ctx: AuthContext, id: string): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { error } = await academicsRepository.softDeleteClass(g.data, id, ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  // ── subjects ──────────────────────────────────────────────────────────────
  async listSubjects(ctx: AuthContext): Promise<Result<SubjectView[]>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { data, error } = await academicsRepository.listSubjects(g.data);
    if (error) return err("INTERNAL", error.message);
    return ok(
      (data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
      })),
    );
  },

  async createSubject(ctx: AuthContext, input: CreateSubjectInput): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const parsed = createSubjectSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");
    const { error } = await academicsRepository.insertSubject(g.data, parsed.data);
    if (error) {
      if (error.code === "23505") return err("CONFLICT", "A subject with that code already exists.");
      return err("INTERNAL", error.message);
    }
    return ok(null);
  },

  async removeSubject(ctx: AuthContext, id: string): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const { error } = await academicsRepository.softDeleteSubject(g.data, id);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  // ── class-subject assignment (current term) ─────────────────────────────────
  async getClassAssignment(ctx: AuthContext, classId: string): Promise<Result<ClassAssignmentView>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const schoolId = g.data;

    const { data: klass } = await academicsRepository.getClassById(schoolId, classId);
    if (!klass) return err("NOT_FOUND", "Class not found.");

    const [{ data: term }, { data: subjects }, { data: teachers }] = await Promise.all([
      academicsRepository.getCurrentTerm(schoolId),
      academicsRepository.listSubjects(schoolId),
      academicsRepository.listTeachers(schoolId),
    ]);

    const termId = (term?.id as string | undefined) ?? null;
    const existing = new Map<string, string | null>();
    if (termId) {
      const { data: cs } = await academicsRepository.listClassSubjects(schoolId, classId, termId);
      for (const row of cs ?? []) existing.set(row.subject_id, row.teacher_id ?? null);
    }

    return ok({
      klass: { id: klass.id, name: klass.name, level: klass.level, arm: klass.arm },
      term: term ? { id: term.id, name: term.name } : null,
      subjects: (subjects ?? []).map((s) => ({
        subjectId: s.id,
        name: s.name,
        code: s.code,
        offered: existing.has(s.id),
        teacherId: existing.get(s.id) ?? null,
      })),
      teachers: (teachers ?? []).map((t) => ({ userId: t.user_id, fullName: t.full_name })),
    });
  },

  /** Reconcile a class's subject offerings + teachers for the current term. */
  async saveClassAssignment(ctx: AuthContext, input: SaveAssignmentInput): Promise<Result<null>> {
    const g = guard(ctx);
    if (!g.ok) return g;
    const schoolId = g.data;

    const parsed = saveAssignmentSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", "Invalid assignment.");

    const { data: term } = await academicsRepository.getCurrentTerm(schoolId);
    if (!term) return err("CONFLICT", "Set a current term before assigning subjects.");
    const termId = term.id as string;

    const { data: existingRows } = await academicsRepository.listClassSubjects(
      schoolId,
      parsed.data.classId,
      termId,
    );
    const existing = new Map<string, { id: string; teacherId: string | null }>();
    for (const r of existingRows ?? []) existing.set(r.subject_id, { id: r.id, teacherId: r.teacher_id ?? null });

    for (const item of parsed.data.items) {
      const current = existing.get(item.subjectId);
      if (item.offered) {
        if (current) {
          if (current.teacherId !== item.teacherId) {
            await academicsRepository.updateClassSubjectTeacher(schoolId, current.id, item.teacherId);
          }
        } else {
          await academicsRepository.insertClassSubject(schoolId, {
            classId: parsed.data.classId,
            subjectId: item.subjectId,
            termId,
            teacherId: item.teacherId,
          });
        }
      } else if (current) {
        await academicsRepository.softDeleteClassSubject(schoolId, current.id);
      }
    }
    return ok(null);
  },
};
