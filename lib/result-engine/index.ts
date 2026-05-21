/**
 * Result Engine — pure, deterministic, idempotent computation (§6).
 *
 * No I/O lives here. The orchestrator (modules/results/service.ts) loads scores,
 * config, and the roster from repositories, builds an EngineConfig snapshot,
 * calls these functions, then persists via upsert and advances the approval
 * workflow. Recomputing the same inputs always yields identical outputs.
 */
import { aggregateSubject } from "./aggregate";
import { resolveGrade } from "./grade";
import { rank, type Rankable } from "./rank";
import type {
  EngineConfig,
  RawScore,
  SubjectResult,
} from "./types";

export * from "./types";
export { aggregateSubject, obtainableTotal, round } from "./aggregate";
export { resolveGrade, validateGradeBands } from "./grade";
export { rank } from "./rank";
export { aggregateTerm } from "./term-aggregate";
export { aggregateCumulative, type CumulativeAggregate } from "./cumulative";
export { evaluatePromotion } from "./promotion";
export { resolveAverageRemark } from "./remarks";

/** Raw scores grouped by student for one class-subject. */
export interface StudentScores {
  studentRef: string;
  scores: RawScore[];
}

/**
 * Compute results for a whole class-subject in one pass: aggregate each
 * student, grade them, then rank by total. Batch-oriented (not row-by-row) so
 * it scales to large cohorts (§6.8). Pure — feed it a snapshot, get results.
 */
export function computeClassSubjectResults(
  students: StudentScores[],
  config: EngineConfig,
): SubjectResult[] {
  const dp = config.rounding.dp;

  // 1. aggregate + grade each student
  const partial = students.map((s) => {
    const agg = aggregateSubject(config.components, s.scores, dp);
    const graded = resolveGrade(agg.total, config.gradeBands);
    return {
      studentRef: s.studentRef,
      caTotal: agg.caTotal,
      examScore: agg.examScore,
      total: agg.total,
      grade: graded?.grade ?? null,
      gradePoint: graded?.gradePoint ?? null,
      remark: graded?.remark ?? null,
      isAbsent: agg.isAbsent,
      isExempt: agg.isExempt,
    };
  });

  // 2. rank by total (excluding absent/exempt per policy)
  const rankables: Rankable[] = partial.map((p) => ({
    ref: p.studentRef,
    score: p.total,
    excluded: p.isExempt || (config.excludeAbsentFromRank && p.isAbsent),
  }));
  const positions = rank(rankables, config.tieStrategy);

  // 3. attach positions
  return partial.map((p) => ({
    ...p,
    subjectPosition: positions.get(p.studentRef) ?? null,
  }));
}
