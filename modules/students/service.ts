import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { authRepository } from "@/modules/auth/repository";
import { sendAccountSetupEmail } from "@/modules/auth/service";
import { createStudentSchema, updateStudentSchema, studentLoginSchema, type CreateStudentInput, type UpdateStudentInput, type StudentLoginInput } from "./schema";
import { studentsRepository } from "./repository";

export interface StudentView {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: string | null;
  classLabel: string | null;
}
export interface StudentDetail {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  classId: string | null;
  classLabel: string | null;
  photoUrl: string | null;
  hasLogin: boolean;
  status: string;
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

  async get(ctx: AuthContext, id: string): Promise<Result<StudentDetail>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.read")) return err("FORBIDDEN", "Not allowed.");
    const [{ data: s }, { data: classes }] = await Promise.all([
      studentsRepository.get(ctx.schoolId, id),
      studentsRepository.listClasses(ctx.schoolId),
    ]);
    if (!s) return err("NOT_FOUND", "Student not found.");
    const klass = (classes ?? []).find((c) => c.id === s.current_class_id);
    return ok({
      id: s.id as string,
      admissionNo: s.admission_no as string,
      firstName: s.first_name as string,
      lastName: s.last_name as string,
      otherNames: (s.other_names as string | null) ?? null,
      gender: (s.gender as string | null) ?? null,
      dateOfBirth: (s.date_of_birth as string | null) ?? null,
      classId: (s.current_class_id as string | null) ?? null,
      classLabel: klass ? classLabel(klass) : null,
      photoUrl: (s.photo_url as string | null) ?? null,
      hasLogin: Boolean(s.user_id),
      status: s.status as string,
    });
  },

  async update(ctx: AuthContext, input: UpdateStudentInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const parsed = updateStudentSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid details.");
    const d = parsed.data;
    const { error } = await studentsRepository.update(
      ctx.schoolId,
      d.id,
      {
        first_name: d.firstName,
        last_name: d.lastName,
        other_names: d.otherNames ?? null,
        gender: d.gender ?? null,
        date_of_birth: d.dateOfBirth ?? null,
        ...(d.classId ? { current_class_id: d.classId } : {}),
      },
      ctx.userId,
    );
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  /** Provision a student login (role: student) and link it to the record. */
  async createLogin(ctx: AuthContext, input: StudentLoginInput): Promise<Result<{ emailSent: boolean }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const parsed = studentLoginSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Enter a valid email.");
    try {
      const user = await authRepository.createLogin(parsed.data.email, ctx.schoolId, ["student"]);
      if (!user) return err("INTERNAL", "Could not create the login.");
      const { error } = await studentsRepository.update(ctx.schoolId, parsed.data.id, { user_id: user.id }, ctx.userId);
      if (error) return err("INTERNAL", error.message);
      await auditService.record({ schoolId: ctx.schoolId, actorId: ctx.userId, action: "student.login_created", entityType: "student", entityId: parsed.data.id });
      const emailSent = await sendAccountSetupEmail({ email: parsed.data.email, schoolId: ctx.schoolId, roleLabel: "student" });
      return ok({ emailSent });
    } catch (e) {
      const dup = /already|registered|exists/i.test((e as Error).message ?? "");
      return dup ? err("CONFLICT", "An account with that email already exists.") : err("INTERNAL", "Could not create the login.");
    }
  },

  async setPhotoUrl(ctx: AuthContext, id: string, url: string): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const { error } = await studentsRepository.update(ctx.schoolId, id, { photo_url: url }, ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  async remove(ctx: AuthContext, id: string): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.write")) return err("FORBIDDEN", "Not allowed.");
    const { error } = await studentsRepository.softDelete(ctx.schoolId, id, ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },
};
