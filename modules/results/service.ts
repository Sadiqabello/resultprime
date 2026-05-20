import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  computeClassSubjectResults,
  aggregateTerm,
  rank,
  type StudentScores,
} from "@/lib/result-engine";
import { gradingService } from "@/modules/grading/service";
import { resultsRepository, type TermResultRow } from "./repository";

export interface ClassOption {
  id: string;
  label: string;
}
export interface BroadsheetRow {
  enrollmentId: string;
  name: string;
  admissionNo: string;
  totals: Record<string, { total: number; grade: string | null }>;
  average: number | null;
  position: number | null;
}
export interface BroadsheetView {
  classLabel: string;
  termName: string | null;
  computed: boolean;
  subjects: { subjectId: string; name: string }[];
  rows: BroadsheetRow[];
}

function classLabel(c?: { name: string; arm: string | null }) {
  if (!c) return "—";
  return c.arm ? `${c.name} ${c.arm}` : c.name;
}

export const resultsService = {
  async listClasses(ctx: AuthContext): Promise<Result<ClassOption[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const { data, error } = await resultsRepository.listClassesLite(ctx.schoolId);
    if (error) return err("INTERNAL", error.message);
    return ok((data ?? []).map((c) => ({ id: c.id, label: classLabel(c) })));
  },

  /**
   * Compute every subject for a class this term, then aggregate per student and
   * rank the class — populating `results` and `term_results`. Idempotent.
   */
  async computeClass(ctx: AuthContext, classId: string): Promise<Result<{ subjects: number; students: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.compute")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    // Config: components (for id→key) + the engine config snapshot.
    const compsRes = await gradingService.getActiveComponents(ctx);
    if (!compsRes.ok) return compsRes;
    if (compsRes.data.length === 0) return err("CONFLICT", "Set up your grading system before computing.");
    const idToKey = new Map(compsRes.data.map((c) => [c.id, c.key]));

    const cfgRes = await gradingService.buildEngineConfig(ctx);
    if (!cfgRes.ok) return cfgRes;
    const config = cfgRes.data;
    const obtainablePerSubject = config.components.reduce((s, c) => s + c.maxScore, 0);

    const { data: term } = await resultsRepository.getCurrentTerm(schoolId);
    if (!term) return err("CONFLICT", "Set a current term before computing.");
    const termId = term.id as string;

    const { data: csRows } = await resultsRepository.listClassSubjects(schoolId, classId, termId);
    if (!csRows || csRows.length === 0) return err("CONFLICT", "No subjects assigned to this class for the term.");

    const { data: enr } = await resultsRepository.loadEnrollments(schoolId, classId, termId);
    const enrollmentIds = (enr ?? []).map((e) => e.id as string);
    if (enrollmentIds.length === 0) return err("CONFLICT", "No students enrolled in this class for the term.");

    // Per-student accumulation of subject totals for the term aggregate.
    const termAcc = new Map<string, { subjectId: string; total: number; obtainable: number; isExempt: boolean }[]>();
    for (const id of enrollmentIds) termAcc.set(id, []);

    for (const cs of csRows) {
      const { data: scoreRows } = await resultsRepository.loadScores(schoolId, cs.id, termId);

      const byStudent = new Map<string, StudentScores>();
      for (const id of enrollmentIds) byStudent.set(id, { studentRef: id, scores: [] });
      for (const row of scoreRows ?? []) {
        const entry = byStudent.get(row.enrollment_id);
        const key = idToKey.get(row.assessment_component_id);
        if (!entry || !key) continue;
        entry.scores.push({
          studentRef: row.enrollment_id,
          componentKey: key,
          value: row.score,
          isAbsent: row.is_absent,
          isExempt: row.is_exempt,
        });
      }

      const subjectResults = computeClassSubjectResults([...byStudent.values()], config);
      const { error: upErr } = await resultsRepository.upsertSubjectResults(
        schoolId,
        cs.id,
        termId,
        cs.subject_id,
        subjectResults,
        config,
        subjectResults.length,
      );
      if (upErr) return err("INTERNAL", upErr.message);

      for (const r of subjectResults) {
        termAcc.get(r.studentRef)?.push({
          subjectId: cs.subject_id,
          total: r.total,
          obtainable: obtainablePerSubject,
          isExempt: r.isExempt,
        });
      }
    }

    // Term aggregate + class ranking by average.
    const aggs = enrollmentIds.map((id) => ({
      enrollmentId: id,
      ...aggregateTerm(termAcc.get(id) ?? [], config.rounding.dp),
    }));
    const positions = rank(
      aggs.map((a) => ({ ref: a.enrollmentId, score: a.average, excluded: a.average === null })),
      config.tieStrategy,
    );
    const classSize = aggs.filter((a) => a.average !== null).length;

    const termRows: TermResultRow[] = aggs.map((a) => ({
      enrollmentId: a.enrollmentId,
      classId,
      termId,
      subjectsCount: a.subjectsCount,
      totalObtainable: a.totalObtainable,
      totalObtained: a.totalObtained,
      average: a.average,
      classPosition: positions.get(a.enrollmentId) ?? null,
      classSize,
    }));
    const { error: trErr } = await resultsRepository.upsertTermResults(schoolId, termRows, config);
    if (trErr) return err("INTERNAL", trErr.message);

    logger.info("results.computed_class", {
      schoolId,
      userId: ctx.userId,
      action: "results.compute",
      classId,
      termId,
      subjects: csRows.length,
      students: enrollmentIds.length,
    });
    return ok({ subjects: csRows.length, students: enrollmentIds.length });
  },

  async getBroadsheet(ctx: AuthContext, classId: string): Promise<Result<BroadsheetView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const [{ data: term }, { data: classes }, { data: subjectsLite }] = await Promise.all([
      resultsRepository.getCurrentTerm(schoolId),
      resultsRepository.listClassesLite(schoolId),
      resultsRepository.listSubjectsLite(schoolId),
    ]);
    const klass = (classes ?? []).find((c) => c.id === classId);
    const label = classLabel(klass);

    if (!term) {
      return ok({ classLabel: label, termName: null, computed: false, subjects: [], rows: [] });
    }
    const termId = term.id as string;
    const subjectNames = new Map((subjectsLite ?? []).map((s) => [s.id, s.name as string]));

    const { data: csRows } = await resultsRepository.listClassSubjects(schoolId, classId, termId);
    const subjects = (csRows ?? []).map((cs) => ({
      subjectId: cs.subject_id as string,
      name: subjectNames.get(cs.subject_id) ?? "—",
    }));
    const classSubjectIds = (csRows ?? []).map((cs) => cs.id as string);

    const [{ data: enr }, { data: resultRows }, { data: termRows }] = await Promise.all([
      resultsRepository.loadEnrollments(schoolId, classId, termId),
      resultsRepository.loadClassResults(schoolId, classSubjectIds, termId),
      resultsRepository.loadTermResults(schoolId, classId, termId),
    ]);

    const { data: studs } = await resultsRepository.loadStudents(
      schoolId,
      (enr ?? []).map((e) => e.student_id as string),
    );
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

    const resultMap = new Map<string, { total: number; grade: string | null }>();
    for (const r of resultRows ?? []) {
      resultMap.set(`${r.enrollment_id}:${r.subject_id}`, { total: r.total, grade: r.grade });
    }
    const termMap = new Map(
      (termRows ?? []).map((t) => [t.enrollment_id, { average: t.average as number | null, position: t.class_position as number | null }]),
    );

    const rows: BroadsheetRow[] = (enr ?? [])
      .map((e) => {
        const s = studMap.get(e.student_id);
        const totals: Record<string, { total: number; grade: string | null }> = {};
        for (const subj of subjects) {
          const hit = resultMap.get(`${e.id}:${subj.subjectId}`);
          if (hit) totals[subj.subjectId] = hit;
        }
        const tr = termMap.get(e.id);
        return {
          enrollmentId: e.id as string,
          name: s?.name ?? "—",
          admissionNo: s?.admissionNo ?? "",
          sortKey: s?.sortKey ?? "",
          totals,
          average: tr?.average ?? null,
          position: tr?.position ?? null,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _sortKey, ...row }) => row);

    return ok({
      classLabel: label,
      termName: term.name as string,
      computed: (termRows ?? []).length > 0,
      subjects,
      rows,
    });
  },
};
