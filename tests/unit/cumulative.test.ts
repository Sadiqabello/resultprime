import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { aggregateCumulative, evaluatePromotion } from "@/lib/result-engine";

describe("aggregateCumulative", () => {
  it("averages the terms that have a result, ignoring missing ones", () => {
    expect(aggregateCumulative([80, 70, null], 2)).toEqual({ termsCount: 2, cumulativeAverage: 75 });
  });
  it("rounds half-up to the configured dp", () => {
    expect(aggregateCumulative([80, 75, 71], 2)).toEqual({ termsCount: 3, cumulativeAverage: 75.33 });
    expect(aggregateCumulative([80, 75, 71], 0)).toEqual({ termsCount: 3, cumulativeAverage: 75 });
  });
  it("returns null with no graded terms (no divide-by-zero)", () => {
    expect(aggregateCumulative([null, null, null], 2)).toEqual({ termsCount: 0, cumulativeAverage: null });
    expect(aggregateCumulative([], 2)).toEqual({ termsCount: 0, cumulativeAverage: null });
  });

  it("property: cumulative lies within [min, max] of present terms; null iff none present", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 }))), (terms) => {
        const { termsCount, cumulativeAverage } = aggregateCumulative(terms, 2);
        const present = terms.filter((t): t is number => t !== null);
        expect(termsCount).toBe(present.length);
        if (present.length === 0) {
          expect(cumulativeAverage).toBeNull();
        } else {
          expect(cumulativeAverage!).toBeGreaterThanOrEqual(Math.min(...present));
          expect(cumulativeAverage!).toBeLessThanOrEqual(Math.max(...present));
        }
      }),
    );
  });
});

describe("promotion on cumulative average", () => {
  it("promotes at/above the pass mark, repeats below, pends when unknown", () => {
    const rule = { type: "average_threshold" as const, minAverage: 40 };
    expect(evaluatePromotion(40, rule)).toBe("promoted");
    expect(evaluatePromotion(75, rule)).toBe("promoted");
    expect(evaluatePromotion(39.99, rule)).toBe("repeat");
    expect(evaluatePromotion(null, rule)).toBe("pending");
  });
});
