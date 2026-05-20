import type { GradeBand } from "./types";

export interface ResolvedGrade {
  grade: string;
  remark: string;
  gradePoint: number | null;
}

/**
 * Map a total score to its grade band. Bands are inclusive on both ends; the
 * orchestrator is responsible for validating that bands neither overlap nor
 * leave gaps before computation runs (see §6.5). Returns null if no band
 * matches (defensive — should not happen with validated config).
 */
export function resolveGrade(
  total: number,
  bands: GradeBand[],
): ResolvedGrade | null {
  const band = bands.find((b) => total >= b.min && total <= b.max);
  if (!band) return null;
  return {
    grade: band.grade,
    remark: band.remark,
    gradePoint: band.gradePoint ?? null,
  };
}

/** Validate a grade band set: sorted, non-overlapping, gap-free across [0,max]. */
export function validateGradeBands(
  bands: GradeBand[],
  max = 100,
): { valid: boolean; reason?: string } {
  if (bands.length === 0) return { valid: false, reason: "No grade bands defined" };
  const sorted = [...bands].sort((a, b) => a.min - b.min);

  if (sorted[0]!.min > 0) return { valid: false, reason: "Bands do not start at 0" };
  if (sorted[sorted.length - 1]!.max < max) {
    return { valid: false, reason: `Bands do not cover up to ${max}` };
  }

  for (let i = 0; i < sorted.length; i++) {
    const band = sorted[i]!;
    if (band.min > band.max) {
      return { valid: false, reason: `Band ${band.grade} has min > max` };
    }
    const next = sorted[i + 1];
    if (next) {
      if (next.min <= band.max) {
        return { valid: false, reason: `Bands overlap near ${band.grade}` };
      }
      if (next.min > band.max + 1) {
        return { valid: false, reason: `Gap between ${band.grade} and ${next.grade}` };
      }
    }
  }
  return { valid: true };
}
