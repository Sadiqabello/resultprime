import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { reportsRepository } from "./repository";

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
      remarks: {
        classTeacher: (tr?.class_teacher_remark as string | null) ?? null,
        principal: (tr?.principal_remark as string | null) ?? null,
      },
      subjects,
    });
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
