import "server-only";
import { err, ok, type Result } from "@/lib/errors";
import type { AuthContext } from "@/lib/authz";
import type { ReportCardView } from "@/modules/reports/service";
import { portalRepository } from "./repository";

export interface PortalStudent {
  id: string;
  name: string;
  admissionNo: string;
}
export interface PortalResultItem {
  enrollmentId: string;
  sessionName: string;
  termName: string;
  className: string;
  average: number | null;
  position: number | null;
  classSize: number | null;
  publishedAt: string | null;
  withheld: boolean;
}
export interface PortalReportCard {
  withheld: boolean;
  studentName: string;
  view: ReportCardView | null;
}

const fullName = (s?: { first_name: string; last_name: string; other_names: string | null } | null) =>
  s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—";
const classLabel = (c?: { name: string; arm: string | null } | null) =>
  c ? (c.arm ? `${c.name} ${c.arm}` : c.name) : "—";

export const portalService = {
  /** Students the signed-in consumer may view (self + any wards). */
  async ownedStudents(ctx: AuthContext): Promise<Result<PortalStudent[]>> {
    const rows = await portalRepository.ownedStudents(ctx.userId);
    return ok(
      rows
        .map((s) => ({ id: s.id as string, name: fullName(s), admissionNo: (s.admission_no as string) ?? "", sortKey: (s.last_name as string) ?? "" }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ sortKey: _s, ...r }) => r),
    );
  },

  /** A viewable student's published results (fee-withheld items flagged). */
  async getStudentResults(ctx: AuthContext, studentId: string): Promise<Result<{ studentName: string; results: PortalResultItem[] }>> {
    const owned = await portalRepository.ownedStudents(ctx.userId);
    const student = owned.find((s) => s.id === studentId);
    if (!student) return err("FORBIDDEN", "You can't view this student.");

    const results = await portalRepository.publishedResults(studentId);
    return ok({ studentName: fullName(student), results });
  },

  /** A published report card for a viewable student, gated by fees. */
  async getReportCard(ctx: AuthContext, enrollmentId: string): Promise<Result<PortalReportCard>> {
    const context = await portalRepository.enrollmentContext(enrollmentId);
    if (!context) return err("NOT_FOUND", "Result not found.");

    const owned = await portalRepository.ownedStudents(ctx.userId);
    const student = owned.find((s) => s.id === context.studentId);
    if (!student) return err("FORBIDDEN", "You can't view this result.");
    const studentName = fullName(student);

    if (!context.published) return err("NOT_FOUND", "This result hasn't been published.");
    if (!context.feeCleared) return ok({ withheld: true, studentName, view: null });

    const bits = await portalRepository.assembleReportCard(enrollmentId);
    if (!bits || !bits.tr) return err("NOT_FOUND", "Result not found.");

    const subjectNames = new Map((bits.subjects ?? []).map((s) => [s.id, s.name as string]));
    const subjects = (bits.results ?? [])
      .map((r) => ({
        name: subjectNames.get(r.subject_id) ?? "—",
        ca: Number(r.ca_total) || 0,
        exam: Number(r.exam_score) || 0,
        total: Number(r.total) || 0,
        grade: r.grade as string | null,
        remark: r.remark as string | null,
        position: r.subject_position as number | null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const tr = bits.tr;
    const view: ReportCardView = {
      computed: true,
      published: true,
      verifyCode: tr.id as string,
      publishedAt: (tr.published_at as string | null) ?? null,
      school: {
        name: (bits.school?.name as string) ?? "School",
        logoUrl: (bits.settings?.logo_url as string | null) ?? null,
        primaryColor: (bits.settings?.primary_color as string | null) ?? null,
      },
      student: { name: studentName, admissionNo: (bits.student?.admission_no as string) ?? "" },
      className: classLabel(bits.cls),
      sessionName: (bits.session?.name as string) ?? "",
      termName: (bits.term?.name as string) ?? "",
      summary: {
        average: (tr.average as number | null) ?? null,
        classPosition: (tr.class_position as number | null) ?? null,
        classSize: (tr.class_size as number | null) ?? null,
        totalObtained: Number(tr.total_obtained) || 0,
        totalObtainable: Number(tr.total_obtainable) || 0,
        gradeOverall: (tr.grade_overall as string | null) ?? null,
      },
      attendance: {
        present: (tr.attendance_present as number | null) ?? null,
        total: (tr.attendance_total as number | null) ?? null,
      },
      remarks: {
        classTeacher: (tr.class_teacher_remark as string | null) ?? null,
        principal: (tr.principal_remark as string | null) ?? null,
      },
      traits: Array.isArray(tr.traits) ? (tr.traits as ReportCardView["traits"]) : [],
      signatureUrl: (bits.settings?.principal_signature_url as string | null) ?? null,
      subjects,
    };

    return ok({ withheld: false, studentName, view });
  },
};
