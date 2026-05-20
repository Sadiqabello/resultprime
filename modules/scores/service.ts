import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { gradingService } from "@/modules/grading/service";
import { saveScoresSchema, type SaveScoresInput } from "./schema";
import { scoresRepository } from "./repository";

const LOCKED_STATES = ["submitted", "l1_approved", "approved", "published"];

export interface EntrySheetItem {
  classSubjectId: string;
  classLabel: string;
  subjectName: string;
  teacherName: string | null;
}
export interface SheetComponent {
  id: string;
  label: string;
  maxScore: number;
  isExam: boolean;
}
export interface SheetStudent {
  enrollmentId: string;
  name: string;
  admissionNo: string;
}
export interface SheetView {
  classSubjectId: string;
  termId: string;
  classLabel: string;
  subjectName: string;
  termName: string;
  locked: boolean;
  components: SheetComponent[];
  students: SheetStudent[];
  scores: Record<string, number | null>; // `${enrollmentId}:${componentId}`
}

function classLabel(c?: { name: string; arm: string | null }) {
  if (!c) return "—";
  return c.arm ? `${c.name} ${c.arm}` : c.name;
}

export const scoresService = {
  /** Class-subjects the current user can enter scores for, this term. */
  async listEntrySheets(
    ctx: AuthContext,
  ): Promise<Result<{ termName: string | null; items: EntrySheetItem[] }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: term } = await scoresRepository.getCurrentTerm(schoolId);
    if (!term) return ok({ termName: null, items: [] });

    const canEnterAny = can(ctx, "results.compute"); // exam officer & co.
    const { data: rows, error } = await scoresRepository.listClassSubjectsForTerm(
      schoolId,
      term.id,
      canEnterAny ? {} : { teacherId: ctx.userId },
    );
    if (error) return err("INTERNAL", error.message);

    const [{ data: classes }, { data: subjects }, { data: teachers }] = await Promise.all([
      scoresRepository.listClassesLite(schoolId),
      scoresRepository.listSubjectsLite(schoolId),
      canEnterAny ? scoresRepository.listTeacherNames(schoolId) : Promise.resolve({ data: [] }),
    ]);
    const classMap = new Map((classes ?? []).map((c) => [c.id, classLabel(c)]));
    const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name as string]));
    const teacherMap = new Map((teachers ?? []).map((t) => [t.user_id, t.full_name as string]));

    const items: EntrySheetItem[] = (rows ?? [])
      .map((r) => ({
        classSubjectId: r.id as string,
        classLabel: classMap.get(r.class_id) ?? "—",
        subjectName: subjectMap.get(r.subject_id) ?? "—",
        teacherName: canEnterAny ? teacherMap.get(r.teacher_id) ?? null : null,
      }))
      .sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.subjectName.localeCompare(b.subjectName));

    return ok({ termName: term.name, items });
  },

  /** Full sheet payload for one class-subject. */
  async getSheet(ctx: AuthContext, classSubjectId: string): Promise<Result<SheetView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: cs } = await scoresRepository.getClassSubject(schoolId, classSubjectId);
    if (!cs) return err("NOT_FOUND", "Class-subject not found.");

    const canEnterAny = can(ctx, "results.compute");
    if (!canEnterAny && cs.teacher_id !== ctx.userId) {
      return err("FORBIDDEN", "This subject isn't assigned to you.");
    }

    const componentsRes = await gradingService.getActiveComponents(ctx);
    const components = (componentsRes.ok ? componentsRes.data : []).map((c) => ({
      id: c.id,
      label: c.label,
      maxScore: c.maxScore,
      isExam: c.isExam,
    }));

    const [{ data: term }, { data: classes }, { data: subjects }, { data: enrollments }, { data: scoreRows }, { data: approval }] =
      await Promise.all([
        scoresRepository.getCurrentTerm(schoolId),
        scoresRepository.listClassesLite(schoolId),
        scoresRepository.listSubjectsLite(schoolId),
        scoresRepository.loadEnrollments(schoolId, cs.class_id, cs.term_id),
        scoresRepository.loadScores(schoolId, classSubjectId, cs.term_id),
        scoresRepository.getApprovalState(schoolId, classSubjectId, cs.term_id),
      ]);

    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    const { data: studs } = await scoresRepository.loadStudents(schoolId, studentIds);
    const studMap = new Map(
      (studs ?? []).map((s) => [
        s.id,
        {
          name: [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" "),
          admissionNo: s.admission_no as string,
          sortKey: (s.last_name as string) ?? "",
        },
      ]),
    );

    const students: SheetStudent[] = (enrollments ?? [])
      .map((e) => {
        const s = studMap.get(e.student_id);
        return { enrollmentId: e.id as string, name: s?.name ?? "—", admissionNo: s?.admissionNo ?? "", sortKey: s?.sortKey ?? "" };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ enrollmentId, name, admissionNo }) => ({ enrollmentId, name, admissionNo }));

    const scores: Record<string, number | null> = {};
    for (const r of scoreRows ?? []) {
      scores[`${r.enrollment_id}:${r.assessment_component_id}`] = r.score;
    }

    const classMap = new Map((classes ?? []).map((c) => [c.id, classLabel(c)]));
    const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name as string]));

    return ok({
      classSubjectId,
      termId: cs.term_id,
      classLabel: classMap.get(cs.class_id) ?? "—",
      subjectName: subjectMap.get(cs.subject_id) ?? "—",
      termName: (term?.name as string | undefined) ?? "Current",
      locked: LOCKED_STATES.includes(approval?.state ?? ""),
      components,
      students,
      scores,
    });
  },

  async save(ctx: AuthContext, input: SaveScoresInput): Promise<Result<{ saved: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const parsed = saveScoresSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", "Invalid scores.");
    const data = parsed.data;

    const { data: cs } = await scoresRepository.getClassSubject(schoolId, data.classSubjectId);
    if (!cs) return err("NOT_FOUND", "Class-subject not found.");
    if (cs.term_id !== data.termId) return err("CONFLICT", "Term mismatch.");

    const canEnterAny = can(ctx, "results.compute");
    if (!canEnterAny && cs.teacher_id !== ctx.userId) {
      return err("FORBIDDEN", "This subject isn't assigned to you.");
    }

    const { data: approval } = await scoresRepository.getApprovalState(schoolId, data.classSubjectId, data.termId);
    if (LOCKED_STATES.includes(approval?.state ?? "")) {
      return err("RESULT_LOCKED", "These results are locked. Return or unlock them to edit.");
    }

    // Validate each score against its component's max (defense in depth).
    const componentsRes = await gradingService.getActiveComponents(ctx);
    const maxById = new Map((componentsRes.ok ? componentsRes.data : []).map((c) => [c.id, c.maxScore]));
    for (const cell of data.cells) {
      if (cell.value == null) continue;
      const max = maxById.get(cell.assessmentComponentId);
      if (max != null && cell.value > max) {
        return err("VALIDATION", `A score exceeds its maximum of ${max}.`);
      }
    }

    const { error } = await scoresRepository.upsertCells(schoolId, data, ctx.userId);
    if (error) {
      // The lock trigger raises check_violation if results were locked mid-edit.
      if (error.code === "23514") return err("RESULT_LOCKED", "These results are locked.");
      return err("INTERNAL", error.message);
    }
    return ok({ saved: data.cells.length });
  },
};
