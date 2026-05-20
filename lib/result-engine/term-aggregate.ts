import { round } from "./aggregate";
import type { SubjectScoreForTerm } from "./types";

export interface TermAggregate {
  subjectsCount: number;
  totalObtainable: number;
  totalObtained: number;
  average: number | null;
}

/**
 * Aggregate a student's subject results into a term summary. Exempt subjects are
 * excluded from BOTH numerator and denominator so they don't penalise the
 * student. Returns average = null when no graded subjects exist (avoids
 * division by zero — see edge cases in §6.6).
 */
export function aggregateTerm(
  subjects: SubjectScoreForTerm[],
  dp: 0 | 1 | 2,
): TermAggregate {
  const graded = subjects.filter((s) => !s.isExempt);

  const totalObtained = graded.reduce((sum, s) => sum + s.total, 0);
  const totalObtainable = graded.reduce((sum, s) => sum + s.obtainable, 0);

  const average =
    graded.length === 0 ? null : round(totalObtained / graded.length, dp);

  return {
    subjectsCount: graded.length,
    totalObtained: round(totalObtained, dp),
    totalObtainable: round(totalObtainable, dp),
    average,
  };
}
