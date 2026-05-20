/**
 * Resolve an auto-generated remark from an average. Schools can override the
 * thresholds via config; these are sensible defaults. The class teacher's and
 * principal's free-text remarks are captured separately (not generated here).
 */
export interface RemarkBand {
  min: number;
  comment: string;
}

const DEFAULT_REMARK_BANDS: RemarkBand[] = [
  { min: 75, comment: "Excellent result. Keep it up." },
  { min: 60, comment: "Very good. A little more effort for the top." },
  { min: 50, comment: "Good. Aim higher next term." },
  { min: 40, comment: "Fair. More commitment is needed." },
  { min: 0, comment: "Poor. Serious improvement required." },
];

export function resolveAverageRemark(
  average: number | null,
  bands: RemarkBand[] = DEFAULT_REMARK_BANDS,
): string | null {
  if (average === null) return null;
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => average >= b.min)?.comment ?? null;
}
