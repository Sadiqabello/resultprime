import { round } from "./aggregate";

export interface CumulativeAggregate {
  termsCount: number;
  cumulativeAverage: number | null;
}

/**
 * Combine a student's per-term averages into a session (annual) average — the
 * mean of the terms that actually have a result. Returns null when no term has a
 * graded average (no divide-by-zero, §6.6). Weighting is uniform per term for
 * MVP; a school could later weight the exam term more heavily via config.
 */
export function aggregateCumulative(
  termAverages: (number | null)[],
  dp: 0 | 1 | 2,
): CumulativeAggregate {
  const present = termAverages.filter((a): a is number => a !== null);
  if (present.length === 0) return { termsCount: 0, cumulativeAverage: null };
  const sum = present.reduce((a, b) => a + b, 0);
  return { termsCount: present.length, cumulativeAverage: round(sum / present.length, dp) };
}
