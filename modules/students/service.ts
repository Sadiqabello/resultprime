import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createStudentSchema, type CreateStudentInput } from "./schema";
import { studentsRepository } from "./repository";

export interface StudentView {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: string | null;
  classLabel: string | null;
}
export interface ClassOption {
  id: string;
  label: string;
}

function classLabel(c: { name: string; arm: string | null }) {
  return c.arm ? `${c.name} ${c.arm}` : c.name;
}

export const studentsService = {
  async listClasses(ctx: AuthContext): Promise<Result<ClassOption[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.read")) return err("FORBIDDEN", "Not allowed.");
    const { data, error } = await studentsRepository.listClasses(ctx.schoolId);
    if (error) return err("INTERNAL", error.message);
    return ok((data ?? []).map((c) => ({ id: c.id, label: classLabel(c) })));
  },

  async list(ctx: AuthContext, opts: { classId?: string } = {}): Promise<Result<StudentView[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.read")) return err("FORBIDDEN", "Not allowed.");

    const [{ data: students, error }, { data: classes }] = await Promise.all([
      studentsRepository.list(ctx.schoolId, opts),
      studentsRepository.listClasses(ctx.schoolId),
    ]);
    if (error) return err("INTERNAL", error.message);

    const classMap = new Map<string, string>();
    for (const c of classes ?? []) classMap.set(c.id, classLabel(c));

    return ok(
      (students ?? []).map((s) => ({
        id: s.id,
        admissionNo: s.admission_no,
        fullName: [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" "),
        gender: s.gender,
        classLabel: s.current_class_id ? classMap.get(s.current_class_id) ?? null : null,
      })),
    );
  },

  /** Create a student and enrol them into the chosen class for the current term. */
  async create(ctx: AuthContext, input: CreateStudentInput): Promise<Result<{ id: string }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.write")) return err("FORBIDDEN", "Not allowed.");

    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid student details.");

    const { data: term } = await studentsRepository.getCurrentTermContext(ctx.schoolId);
    if (!term) return err("CONFLICT", "Set a current term in Settings before enrolling students.");

    const { data: student, error } = await studentsRepository.create(ctx.schoolId, parsed.data, ctx.userId);
    if (error || !student) {
      if (error?.code === "23505") return err("CONFLICT", "A student with that admission number exists.");
      return err("INTERNAL", error?.message ?? "Could not create student.");
    }
    const studentId = student.id as string;

    const { error: enrolErr } = await studentsRepository.insertEnrollment(ctx.schoolId, {
      studentId,
      classId: parsed.data.classId,
      sessionId: term.session_id as string,
      termId: term.id as string,
    });
    if (enrolErr) {
      // roll back the orphan student so re-adding works cleanly
      await studentsRepository.hardDelete(ctx.schoolId, studentId).catch(() => {});
      return err("INTERNAL", enrolErr.message);
    }

    logger.info("students.created", { schoolId: ctx.schoolId, studentId });
    return ok({ id: studentId });
  },

  async remove(ctx: AuthContext, id: string): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.write")) return err("FORBIDDEN", "Not allowed.");
    const { error } = await studentsRepository.softDelete(ctx.schoolId, id, ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },
};
