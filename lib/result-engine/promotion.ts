import type { PromotionStatus } from "@/config/constants";
import type { PromotionRule } from "./types";

/**
 * Evaluate promotion eligibility from a (cumulative or term) average against a
 * configured rule. Term-level callers typically pass "pending"/"na" until the
 * annual rollup runs (§6 — promotion is usually decided on cumulative results).
 */
export function evaluatePromotion(
  average: number | null,
  rule: PromotionRule,
): PromotionStatus {
  if (average === null) return "pending";

  switch (rule.type) {
    case "average_threshold": {
      const threshold = rule.minAverage ?? 40;
      return average >= threshold ? "promoted" : "repeat";
    }
    case "pass_core_subjects":
      // Requires per-subject pass data; decided by the orchestrator. Default
      // to pending here so the engine never guesses with missing inputs.
      return "pending";
    default:
      return "na";
  }
}
