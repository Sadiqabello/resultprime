import type { AssessmentComponent, RawScore } from "./types";

/** Round half-up to the given decimal places. Deterministic — no float drift games. */
export function round(value: number, dp: 0 | 1 | 2): number {
  const f = Math.pow(10, dp);
  return Math.round((value + Number.EPSILON) * f) / f;
}

export interface AggregatedSubjectScore {
  caTotal: number;
  examScore: number;
  total: number;
  isAbsent: boolean;
  isExempt: boolean;
}

/**
 * Aggregate one student's component scores for a subject into CA total, exam
 * score, and overall total. Absent/exempt flags propagate. Missing values are
 * treated as 0 for the running total but flagged upstream during validation —
 * the engine never invents data, it only sums what it is given.
 */
export function aggregateSubject(
  components: AssessmentComponent[],
  scores: RawScore[],
  dp: 0 | 1 | 2,
): AggregatedSubjectScore {
  const byKey = new Map(scores.map((s) => [s.componentKey, s]));

  let caTotal = 0;
  let examScore = 0;
  const isAbsent = scores.some((s) => s.isAbsent);
  const isExempt = scores.some((s) => s.isExempt);

  for (const component of components) {
    const raw = byKey.get(component.key);
    const value = raw?.value ?? 0;
    if (component.isExam) examScore += value;
    else caTotal += value;
  }

  return {
    caTotal: round(caTotal, dp),
    examScore: round(examScore, dp),
    total: round(caTotal + examScore, dp),
    isAbsent,
    isExempt,
  };
}

/** Sum of all component max scores — the obtainable mark for a subject. */
export function obtainableTotal(components: AssessmentComponent[]): number {
  return components.reduce((sum, c) => sum + c.maxScore, 0);
}
