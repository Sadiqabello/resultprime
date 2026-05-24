import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  rank,
  round,
  aggregateTerm,
  resolveGrade,
  validateGradeBands,
  type GradeBand,
  type Rankable,
} from "@/lib/result-engine";

/**
 * Property-based invariants for the result engine (§6, §20). Golden tests pin
 * specific outputs; these assert laws that must hold for ALL inputs — the kind
 * of guarantee an exam system needs (no student silently mis-ranked or ungraded).
 */

describe("round — properties", () => {
  it("is idempotent and never drifts more than half a ulp", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.constantFrom(0, 1, 2) as fc.Arbitrary<0 | 1 | 2>,
        (x, dp) => {
          const r = round(x, dp);
          expect(round(r, dp)).toBe(r); // idempotent
          expect(Math.abs(r - x)).toBeLessThanOrEqual(0.5 * 10 ** -dp + 1e-9);
        },
      ),
    );
  });
});

describe("rank — properties", () => {
  const items = fc.uniqueArray(
    fc.record({
      ref: fc.string({ minLength: 1, maxLength: 6 }),
      score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
      excluded: fc.boolean(),
    }),
    { selector: (i) => i.ref, minLength: 1, maxLength: 25 },
  );

  it("assigns a position to exactly the eligible entries; excludes the rest", () => {
    fc.assert(
      fc.property(items, fc.constantFrom("dense", "standard") as fc.Arbitrary<"dense" | "standard">, (xs, strat) => {
        const pos = rank(xs as Rankable[], strat);
        for (const x of xs) {
          const eligible = !x.excluded && x.score !== null;
          if (eligible) {
            expect(pos.get(x.ref)).toBeGreaterThanOrEqual(1);
          } else {
            expect(pos.get(x.ref)).toBeNull();
          }
        }
      }),
    );
  });

  it("orders by score: higher scores never get a worse position", () => {
    fc.assert(
      fc.property(items, fc.constantFrom("dense", "standard") as fc.Arbitrary<"dense" | "standard">, (xs, strat) => {
        const pos = rank(xs as Rankable[], strat);
        const ranked = xs.filter((x) => !x.excluded && x.score !== null);
        for (const a of ranked) {
          for (const b of ranked) {
            const pa = pos.get(a.ref)!;
            const pb = pos.get(b.ref)!;
            if (a.score! > b.score!) expect(pa).toBeLessThan(pb);
            if (a.score! === b.score!) expect(pa).toBe(pb);
          }
        }
      }),
    );
  });

  it("dense ranking has no gaps; positions are 1..distinctScores", () => {
    fc.assert(
      fc.property(items, (xs) => {
        const pos = rank(xs as Rankable[], "dense");
        const ranked = xs.filter((x) => !x.excluded && x.score !== null);
        const positions = ranked.map((x) => pos.get(x.ref)!);
        const distinct = new Set(ranked.map((x) => x.score)).size;
        if (positions.length > 0) {
          expect(Math.min(...positions)).toBe(1);
          expect(Math.max(...positions)).toBe(distinct);
        }
      }),
    );
  });
});

describe("grade bands — properties", () => {
  // Build a valid, gap-free, non-overlapping band set from random interior cuts.
  const validBands = fc
    .uniqueArray(fc.integer({ min: 1, max: 99 }), { minLength: 0, maxLength: 8 })
    .map((cutsRaw): GradeBand[] => {
      const cuts = [...cutsRaw].sort((a, b) => a - b);
      const bounds = [0, ...cuts.map((c) => c), 100];
      const bands: GradeBand[] = [];
      // segments: [0..c1], [c1+1..c2], ... last ends at 100
      let lo = 0;
      const uniqueCuts = [...new Set(cuts)];
      for (let i = 0; i < uniqueCuts.length; i++) {
        const hi = uniqueCuts[i]!;
        bands.push({ min: lo, max: hi, grade: `G${i}`, remark: "" });
        lo = hi + 1;
      }
      bands.push({ min: lo, max: 100, grade: `G${uniqueCuts.length}`, remark: "" });
      void bounds;
      return bands;
    })
    .filter((b) => validateGradeBands(b, 100).valid);

  it("a validated band set grades every total in [0,100]", () => {
    fc.assert(
      fc.property(validBands, fc.integer({ min: 0, max: 100 }), (bands, total) => {
        expect(validateGradeBands(bands, 100).valid).toBe(true);
        expect(resolveGrade(total, bands)).not.toBeNull();
      }),
    );
  });
});

describe("aggregateTerm — properties", () => {
  const subjects = fc.array(
    fc.record({
      subjectId: fc.string({ minLength: 1, maxLength: 4 }),
      total: fc.integer({ min: 0, max: 100 }),
      obtainable: fc.constant(100),
      isExempt: fc.boolean(),
    }),
    { maxLength: 15 },
  );

  it("average is null or a percentage within [0,100]", () => {
    fc.assert(
      fc.property(subjects, (subs) => {
        const agg = aggregateTerm(subs, 2);
        if (agg.average !== null) {
          expect(agg.average).toBeGreaterThanOrEqual(0);
          expect(agg.average).toBeLessThanOrEqual(100);
        }
      }),
    );
  });

  it("adding an exempt subject changes neither the count nor the average", () => {
    fc.assert(
      fc.property(subjects, fc.integer({ min: 0, max: 100 }), (subs, extra) => {
        const before = aggregateTerm(subs, 2);
        const after = aggregateTerm(
          [...subs, { subjectId: "X", total: extra, obtainable: 100, isExempt: true }],
          2,
        );
        expect(after.subjectsCount).toBe(before.subjectsCount);
        expect(after.average).toBe(before.average);
      }),
    );
  });
});
