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
 * student. The average is a true percentage of the marks obtainable
 * (totalObtained / totalObtainable × 100), so it stays correct even when
 * subjects have different obtainable marks. When every subject is out of the
 * same total (the common single-scheme case) this equals the mean subject score.
 * Returns average = null when there's nothing obtainable (no graded subjects, or
 * none with marks) — avoids division by zero (see edge cases in §6.6).
 */
export function aggregateTerm(
  subjects: SubjectScoreForTerm[],
  dp: 0 | 1 | 2,
): TermAggregate {
  const graded = subjects.filter((s) => !s.isExempt);

  const totalObtained = graded.reduce((sum, s) => sum + s.total, 0);
  const totalObtainable = graded.reduce((sum, s) => sum + s.obtainable, 0);

  const average =
    totalObtainable <= 0 ? null : round((totalObtained / totalObtainable) * 100, dp);

  return {
    subjectsCount: graded.length,
    totalObtained: round(totalObtained, dp),
    totalObtainable: round(totalObtainable, dp),
    average,
  };
}
