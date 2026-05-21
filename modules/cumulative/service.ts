import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { gradingService } from "@/modules/grading/service";
import { aggregateCumulative, evaluatePromotion, rank } from "@/lib/result-engine";
import type { PromotionStatus } from "@/config/constants";
import { cumulativeRepository, type CumulativeRow } from "./repository";

export interface AnnualRow {
  studentId: string;
  name: string;
  admissionNo: string;
  termAverages: (number | null)[]; // aligned to `terms` order
  cumulativeAverage: number | null;
  annualPosition: number | null;
  promotionStatus: PromotionStatus;
}
export interface AnnualView {
  classLabel: string;
  sessionName: string | null;
  terms: { id: string; name: string }[];
  nextClassLabel: string | null;
  computed: boolean;
  rows: AnnualRow[];
}

const classLabel = (c?: { name: string; arm: string | null } | null) =>
  c ? (c.arm ? `${c.name} ${c.arm}` : c.name) : "—";
const fullName = (s?: { first_name: string; last_name: string; other_names: string | null }) =>
  s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—";

/** Per-student per-term averages for a class across the session's terms. */
async function loadTermAverages(schoolId: string, classId: string, termIds: string[]) {
  const [{ data: enr }, { data: trs }] = await Promise.all([
    cumulativeRepository.listClassEnrollments(schoolId, classId, termIds),
    cumulativeRepository.listClassTermResults(schoolId, classId, termIds),
  ]);
  const avgByEnrollment = new Map((trs ?? []).map((t) => [t.enrollment_id, t.average as number | null]));
  // student_id -> (term_id -> average)
  const byStudent = new Map<string, Map<string, number | null>>();
  for (const e of enr ?? []) {
    const m = byStudent.get(e.student_id) ?? new Map<string, number | null>();
    m.set(e.term_id, avgByEnrollment.get(e.id) ?? null);
    byStudent.set(e.student_id, m);
  }
  return byStudent;
}

export const cumulativeService = {
  /**
   * Compute the annual (cumulative) result for a class: combine each student's
   * term averages across the current session, rank annual position, and decide
   * promotion against the grading pass mark. Idempotent upsert.
   */
  async computeSession(ctx: AuthContext, classId: string): Promise<Result<{ students: number; terms: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.compute")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: term } = await cumulativeRepository.getCurrentTerm(schoolId);
    if (!term?.session_id) return err("CONFLICT", "Set a current term/session before computing annual results.");
    const sessionId = term.session_id as string;

    const { data: sessionTerms } = await cumulativeRepository.listSessionTerms(schoolId, sessionId);
    const termIds = (sessionTerms ?? []).map((t) => t.id as string);
    if (termIds.length === 0) return err("CONFLICT", "No terms found for the current session.");

    const cfgRes = await gradingService.getConfig(ctx);
    if (!cfgRes.ok) return cfgRes;
    const { passMark, roundingDp, tieStrategy } = cfgRes.data;
    const dp = (roundingDp as 0 | 1 | 2) ?? 2;

    const { data: classes } = await cumulativeRepository.listClassesLite(schoolId);
    const klass = (classes ?? []).find((c) => c.id === classId);
    const nextClassId = (klass?.next_class_id as string | null) ?? null;

    const byStudent = await loadTermAverages(schoolId, classId, termIds);
    if (byStudent.size === 0) return err("CONFLICT", "No enrolments with results for this class this session.");

    const aggs = [...byStudent.entries()].map(([studentId, perTerm]) => {
      const termAverages = termIds.map((t) => perTerm.get(t) ?? null);
      const { termsCount, cumulativeAverage } = aggregateCumulative(termAverages, dp);
      return { studentId, termsCount, cumulativeAverage };
    });

    const positions = rank(
      aggs.map((a) => ({ ref: a.studentId, score: a.cumulativeAverage, excluded: a.cumulativeAverage === null })),
      tieStrategy,
    );
    const classSize = aggs.filter((a) => a.cumulativeAverage !== null).length;

    const rows: CumulativeRow[] = aggs.map((a) => ({
      studentId: a.studentId,
      classId,
      sessionId,
      termsCount: a.termsCount,
      cumulativeAverage: a.cumulativeAverage,
      annualPosition: positions.get(a.studentId) ?? null,
      classSize,
      promotionStatus: evaluatePromotion(a.cumulativeAverage, { type: "average_threshold", minAverage: passMark }),
      nextClassId,
    }));

    const { error } = await cumulativeRepository.upsertCumulative(schoolId, rows, { passMark, dp, tieStrategy });
    if (error) return err("INTERNAL", error.message);

    await auditService.record({
      schoolId,
      actorId: ctx.userId,
      action: "results.compute_cumulative",
      entityType: "class",
      entityId: classId,
      metadata: { sessionId, students: rows.length, terms: termIds.length },
    });
    logger.info("cumulative.computed", { schoolId, userId: ctx.userId, classId, sessionId, students: rows.length });
    return ok({ students: rows.length, terms: termIds.length });
  },

  async getAnnualBroadsheet(ctx: AuthContext, classId: string): Promise<Result<AnnualView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: classes } = await cumulativeRepository.listClassesLite(schoolId);
    const klass = (classes ?? []).find((c) => c.id === classId);
    const label = classLabel(klass);
    const nextClassLabel = klass?.next_class_id
      ? classLabel(classes?.find((c) => c.id === klass.next_class_id))
      : null;

    const { data: term } = await cumulativeRepository.getCurrentTerm(schoolId);
    if (!term?.session_id) return ok({ classLabel: label, sessionName: null, terms: [], nextClassLabel, computed: false, rows: [] });
    const sessionId = term.session_id as string;

    const [{ data: session }, { data: sessionTerms }] = await Promise.all([
      cumulativeRepository.getSession(schoolId, sessionId),
      cumulativeRepository.listSessionTerms(schoolId, sessionId),
    ]);
    const terms = (sessionTerms ?? []).map((t) => ({ id: t.id as string, name: t.name as string }));
    const termIds = terms.map((t) => t.id);

    const byStudent = await loadTermAverages(schoolId, classId, termIds);
    const { data: cum } = await cumulativeRepository.listCumulative(schoolId, classId, sessionId);
    const cumByStudent = new Map((cum ?? []).map((c) => [c.student_id, c]));

    const { data: studs } = await cumulativeRepository.loadStudents(schoolId, [...byStudent.keys()]);
    const studMap = new Map((studs ?? []).map((s) => [s.id, s]));

    const rows: AnnualRow[] = [...byStudent.entries()]
      .map(([studentId, perTerm]) => {
        const s = studMap.get(studentId);
        const c = cumByStudent.get(studentId);
        return {
          studentId,
          name: fullName(s),
          admissionNo: (s?.admission_no as string) ?? "",
          sortKey: (s?.last_name as string) ?? "",
          termAverages: termIds.map((t) => perTerm.get(t) ?? null),
          cumulativeAverage: (c?.cumulative_average as number | null) ?? null,
          annualPosition: (c?.annual_position as number | null) ?? null,
          promotionStatus: (c?.promotion_status as PromotionStatus) ?? "na",
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _s, ...r }) => r);

    return ok({
      classLabel: label,
      sessionName: (session?.name as string) ?? null,
      terms,
      nextClassLabel,
      computed: (cum ?? []).length > 0,
      rows,
    });
  },
};
