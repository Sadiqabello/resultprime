import "server-only";
import { can, hasRole, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { saveExtrasSchema, type SaveExtrasInput } from "./schema";
import { reportsRepository } from "./repository";

export interface ExtrasRow {
  enrollmentId: string;
  name: string;
  admissionNo: string;
  classTeacherRemark: string;
  principalRemark: string;
  attendancePresent: number | null;
  attendanceTotal: number | null;
  average: number | null;
  position: number | null;
}
export interface ClassExtrasView {
  classLabel: string;
  termName: string | null;
  rows: ExtrasRow[];
}

/** Form teacher of the class, or a school-wide results/admin role. */
function canEditExtras(ctx: AuthContext, formTeacherId: string | null): boolean {
  if (!can(ctx, "class.remarks.write")) return false;
  return (
    formTeacherId === ctx.userId ||
    hasRole(ctx, "school_admin") ||
    hasRole(ctx, "principal") ||
    hasRole(ctx, "vice_principal") ||
    hasRole(ctx, "exam_officer")
  );
}

export interface ReportSubject {
  name: string;
  ca: number;
  exam: number;
  total: number;
  grade: string | null;
  remark: string | null;
  position: number | null;
}
export interface ReportCardView {
  computed: boolean;
  published: boolean;
  verifyCode: string | null;
  publishedAt: string | null;
  school: { name: string; logoUrl: string | null; primaryColor: string | null };
  student: { name: string; admissionNo: string };
  className: string;
  sessionName: string;
  termName: string;
  summary: {
    average: number | null;
    classPosition: number | null;
    classSize: number | null;
    totalObtained: number;
    totalObtainable: number;
    gradeOverall: string | null;
  };
  attendance: { present: number | null; total: number | null };
  remarks: { classTeacher: string | null; principal: string | null };
  subjects: ReportSubject[];
}

export interface VerifySummary {
  schoolName: string;
  studentName: string;
  className: string;
  termName: string;
  average: number | null;
  position: number | null;
  classSize: number | null;
  issuedAt: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const classLabel = (c?: { name: string; arm: string | null } | null) =>
  c ? (c.arm ? `${c.name} ${c.arm}` : c.name) : "—";
const fullName = (s?: { first_name: string; last_name: string; other_names: string | null } | null) =>
  s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—";

export const reportsService = {
  /** Build a student's term report card (staff). Renders a draft if unpublished. */
  async getReportCard(ctx: AuthContext, enrollmentId: string): Promise<Result<ReportCardView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: enr } = await reportsRepository.getEnrollment(schoolId, enrollmentId);
    if (!enr) return err("NOT_FOUND", "Enrolment not found.");

    const [{ data: tr }, { data: results }, { data: student }, { data: cls }, { data: term }, { data: school }, { data: settings }, { data: subjectsLite }] =
      await Promise.all([
        reportsRepository.getTermResult(schoolId, enrollmentId),
        reportsRepository.getResults(schoolId, enrollmentId),
        reportsRepository.getStudent(schoolId, enr.student_id),
        reportsRepository.getClass(schoolId, enr.class_id),
        reportsRepository.getTerm(schoolId, enr.term_id),
        reportsRepository.getSchool(schoolId),
        reportsRepository.getSettings(schoolId),
        reportsRepository.listSubjectsLite(schoolId),
      ]);

    const { data: session } = term?.session_id
      ? await reportsRepository.getSession(schoolId, term.session_id)
      : { data: null };

    const subjectNames = new Map((subjectsLite ?? []).map((s) => [s.id, s.name as string]));
    const subjects: ReportSubject[] = (results ?? [])
      .map((r) => ({
        name: subjectNames.get(r.subject_id) ?? "—",
        ca: Number(r.ca_total) || 0,
        exam: Number(r.exam_score) || 0,
        total: Number(r.total) || 0,
        grade: r.grade,
        remark: r.remark,
        position: r.subject_position,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const published = tr?.status === "published";

    return ok({
      computed: Boolean(tr),
      published,
      verifyCode: published ? (tr?.id as string) : null,
      publishedAt: (tr?.published_at as string | null) ?? null,
      school: {
        name: (school?.name as string) ?? "School",
        logoUrl: (settings?.logo_url as string | null) ?? null,
        primaryColor: (settings?.primary_color as string | null) ?? null,
      },
      student: { name: fullName(student), admissionNo: (student?.admission_no as string) ?? "" },
      className: classLabel(cls),
      sessionName: (session?.name as string) ?? "",
      termName: (term?.name as string) ?? "",
      summary: {
        average: (tr?.average as number | null) ?? null,
        classPosition: (tr?.class_position as number | null) ?? null,
        classSize: (tr?.class_size as number | null) ?? null,
        totalObtained: Number(tr?.total_obtained) || 0,
        totalObtainable: Number(tr?.total_obtainable) || 0,
        gradeOverall: (tr?.grade_overall as string | null) ?? null,
      },
      attendance: {
        present: (tr?.attendance_present as number | null) ?? null,
        total: (tr?.attendance_total as number | null) ?? null,
      },
      remarks: {
        classTeacher: (tr?.class_teacher_remark as string | null) ?? null,
        principal: (tr?.principal_remark as string | null) ?? null,
      },
      subjects,
    });
  },

  /** Roster of a class with current remarks/attendance, for the editor. */
  async getClassExtras(ctx: AuthContext, classId: string): Promise<Result<ClassExtrasView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "class.remarks.write")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: klass } = await reportsRepository.getClassMeta(schoolId, classId);
    if (!klass) return err("NOT_FOUND", "Class not found.");
    if (!canEditExtras(ctx, (klass.form_teacher_id as string | null) ?? null)) {
      return err("FORBIDDEN", "You can only edit remarks for your own class.");
    }

    const { data: term } = await reportsRepository.getCurrentTerm(schoolId);
    const label = classLabel(klass);
    if (!term) return ok({ classLabel: label, termName: null, rows: [] });
    const termId = term.id as string;

    const [{ data: extras }, { data: enr }] = await Promise.all([
      reportsRepository.listClassExtras(schoolId, classId, termId),
      reportsRepository.loadEnrollments(schoolId, classId, termId),
    ]);
    const { data: studs } = await reportsRepository.loadStudents(
      schoolId,
      (enr ?? []).map((e) => e.student_id as string),
    );
    const studByEnrollment = new Map(
      (enr ?? []).map((e) => {
        const s = (studs ?? []).find((x) => x.id === e.student_id);
        return [
          e.id as string,
          {
            name: s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—",
            admissionNo: (s?.admission_no as string) ?? "",
            sortKey: (s?.last_name as string) ?? "",
          },
        ];
      }),
    );
    const extrasByEnrollment = new Map((extras ?? []).map((x) => [x.enrollment_id, x]));

    const rows: ExtrasRow[] = (enr ?? [])
      .map((e) => {
        const s = studByEnrollment.get(e.id);
        const x = extrasByEnrollment.get(e.id);
        return {
          enrollmentId: e.id as string,
          name: s?.name ?? "—",
          admissionNo: s?.admissionNo ?? "",
          sortKey: s?.sortKey ?? "",
          classTeacherRemark: (x?.class_teacher_remark as string | null) ?? "",
          principalRemark: (x?.principal_remark as string | null) ?? "",
          attendancePresent: (x?.attendance_present as number | null) ?? null,
          attendanceTotal: (x?.attendance_total as number | null) ?? null,
          average: (x?.average as number | null) ?? null,
          position: (x?.class_position as number | null) ?? null,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _s, ...r }) => r);

    return ok({ classLabel: label, termName: term.name as string, rows });
  },

  /** Persist remarks/attendance for a class's students (form teacher / principal). */
  async saveClassExtras(ctx: AuthContext, input: SaveExtrasInput): Promise<Result<{ saved: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "class.remarks.write")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const parsed = saveExtrasSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid remarks.");
    const data = parsed.data;

    const { data: klass } = await reportsRepository.getClassMeta(schoolId, data.classId);
    if (!klass) return err("NOT_FOUND", "Class not found.");
    if (!canEditExtras(ctx, (klass.form_teacher_id as string | null) ?? null)) {
      return err("FORBIDDEN", "You can only edit remarks for your own class.");
    }

    const { data: term } = await reportsRepository.getCurrentTerm(schoolId);
    if (!term) return err("CONFLICT", "No active term.");
    const termId = term.id as string;

    // Only update enrollments that actually have a computed term_result.
    const { data: extras } = await reportsRepository.listClassExtras(schoolId, data.classId, termId);
    const valid = new Set((extras ?? []).map((x) => x.enrollment_id));

    let saved = 0;
    for (const r of data.rows) {
      if (!valid.has(r.enrollmentId)) continue; // results not computed for this student yet
      const { error } = await reportsRepository.updateExtras(schoolId, r.enrollmentId, termId, {
        class_teacher_remark: r.classTeacherRemark || null,
        principal_remark: r.principalRemark || null,
        attendance_present: r.attendancePresent,
        attendance_total: r.attendanceTotal,
      });
      if (error) return err("INTERNAL", error.message);
      saved++;
    }

    await auditService.record({
      schoolId,
      actorId: ctx.userId,
      action: "results.remarks_update",
      entityType: "class",
      entityId: data.classId,
      metadata: { termId, students: saved },
    });
    logger.info("reports.extras_saved", { schoolId, userId: ctx.userId, action: "results.remarks_update", classId: data.classId, saved });
    return ok({ saved });
  },

  /**
   * Every computed report card for a class this term — drives the batch print
   * route and the merged PDF. Loops the single-card builder (fine for a class;
   * whole-school batches belong in a background job, §11.3/§14.6).
   */
  async getClassReportCards(
    ctx: AuthContext,
    classId: string,
  ): Promise<Result<{ classLabel: string; termName: string | null; cards: ReportCardView[] }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: klass } = await reportsRepository.getClassMeta(schoolId, classId);
    const label = classLabel(klass);
    const { data: term } = await reportsRepository.getCurrentTerm(schoolId);
    if (!term) return ok({ classLabel: label, termName: null, cards: [] });

    const { data: enr } = await reportsRepository.loadEnrollments(schoolId, classId, term.id as string);
    const cards: ReportCardView[] = [];
    for (const e of enr ?? []) {
      const r = await this.getReportCard(ctx, e.id as string);
      if (r.ok && r.data.computed) cards.push(r.data);
    }
    cards.sort((a, b) => a.student.name.localeCompare(b.student.name));
    return ok({ classLabel: label, termName: term.name as string, cards });
  },

  /** Public QR verification — published-only summary, or null. No auth. */
  async verifyByCode(code: string): Promise<Result<VerifySummary | null>> {
    if (!UUID_RE.test(code)) return ok(null);
    let bits: Awaited<ReturnType<typeof reportsRepository.verifyByCode>> = null;
    try {
      bits = await reportsRepository.verifyByCode(code);
    } catch {
      return ok(null); // never 500 a public page on a bad/unknown code
    }
    if (!bits) return ok(null);
    return ok({
      schoolName: (bits.school?.name as string) ?? "—",
      studentName: fullName(bits.stud),
      className: classLabel(bits.cls),
      termName: (bits.term?.name as string) ?? "—",
      average: (bits.tr.average as number | null) ?? null,
      position: (bits.tr.class_position as number | null) ?? null,
      classSize: (bits.tr.class_size as number | null) ?? null,
      issuedAt: (bits.tr.published_at as string | null) ?? null,
    });
  },
};
