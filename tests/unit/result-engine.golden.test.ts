import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  computeClassSubjectResults,
  aggregateSubject,
  aggregateTerm,
  resolveGrade,
  rank,
  type EngineConfig,
  type StudentScores,
} from "@/lib/result-engine";

// ── shared config: CA1 20 · CA2 20 · Exam 60 · standard WAEC-style bands ──────
const components = [
  { key: "ca1", label: "CA1", maxScore: 20, isExam: false },
  { key: "ca2", label: "CA2", maxScore: 20, isExam: false },
  { key: "exam", label: "Exam", maxScore: 60, isExam: true },
];
const gradeBands = [
  { min: 70, max: 100, grade: "A1", remark: "Excellent", gradePoint: 4 },
  { min: 60, max: 69, grade: "B2", remark: "Very Good", gradePoint: 3 },
  { min: 50, max: 59, grade: "C4", remark: "Credit", gradePoint: 2 },
  { min: 40, max: 49, grade: "D7", remark: "Pass", gradePoint: 1 },
  { min: 0, max: 39, grade: "F9", remark: "Fail", gradePoint: 0 },
];
const config: EngineConfig = {
  components,
  gradeBands,
  rounding: { dp: 2, mode: "half_up" },
  tieStrategy: "standard",
  excludeAbsentFromRank: true,
};

const ss = (ref: string, ca1: number | null, ca2: number | null, exam: number | null, flags: { isAbsent?: boolean; isExempt?: boolean } = {}): StudentScores => ({
  studentRef: ref,
  scores: [
    { studentRef: ref, componentKey: "ca1", value: ca1 },
    { studentRef: ref, componentKey: "ca2", value: ca2 },
    { studentRef: ref, componentKey: "exam", value: exam, ...flags },
  ],
});

/**
 * GOLDEN MASTER — a hand-verified class across 3 subjects, exercising ties, an
 * absentee, and an exemption. If a refactor changes any number here, it changed
 * a child's result: that must be intentional, not incidental (§20.4).
 */
describe("golden master: JSS1 A, 4 students × 3 subjects", () => {
  const math = computeClassSubjectResults(
    [ss("s1", 18, 17, 55), ss("s2", 15, 15, 40), ss("s3", 10, 10, 30), ss("s4", 12, 8, null, { isAbsent: true })],
    config,
  );
  const eng = computeClassSubjectResults(
    [ss("s1", 20, 18, 52), ss("s2", 20, 18, 52), ss("s3", 14, 12, 30), ss("s4", 16, 14, 40)],
    config,
  );
  const sci = computeClassSubjectResults(
    [ss("s1", 10, 10, 30), ss("s2", 15, 15, 45), ss("s3", 0, 0, 0, { isExempt: true }), ss("s4", 18, 16, 50)],
    config,
  );
  const byRef = (rs: typeof math, ref: string) => rs.find((r) => r.studentRef === ref)!;

  it("MATH: totals, grades and positions (s4 absent → excluded from rank)", () => {
    expect(byRef(math, "s1")).toMatchObject({ total: 90, grade: "A1", subjectPosition: 1 });
    expect(byRef(math, "s2")).toMatchObject({ total: 70, grade: "A1", subjectPosition: 2 });
    expect(byRef(math, "s3")).toMatchObject({ total: 50, grade: "C4", subjectPosition: 3 });
    expect(byRef(math, "s4")).toMatchObject({ total: 20, grade: "F9", isAbsent: true, subjectPosition: null });
  });

  it("ENG: a tie at the top ranks 1,1,3,4 (standard)", () => {
    expect(byRef(eng, "s1")).toMatchObject({ total: 90, subjectPosition: 1 });
    expect(byRef(eng, "s2")).toMatchObject({ total: 90, subjectPosition: 1 });
    expect(byRef(eng, "s4")).toMatchObject({ total: 70, subjectPosition: 3 });
    expect(byRef(eng, "s3")).toMatchObject({ total: 56, subjectPosition: 4 });
  });

  it("SCI: exempt student excluded from ranking", () => {
    expect(byRef(sci, "s4")).toMatchObject({ total: 84, subjectPosition: 1 });
    expect(byRef(sci, "s2")).toMatchObject({ total: 75, subjectPosition: 2 });
    expect(byRef(sci, "s1")).toMatchObject({ total: 50, subjectPosition: 3 });
    expect(byRef(sci, "s3")).toMatchObject({ isExempt: true, subjectPosition: null });
  });

  it("term averages exclude exempt subjects, then class ranks by average", () => {
    const perStudent: Record<string, { total: number; isExempt: boolean }[]> = {
      s1: [], s2: [], s3: [], s4: [],
    };
    for (const [subjectId, rs] of [["math", math], ["eng", eng], ["sci", sci]] as const) {
      for (const r of rs) perStudent[r.studentRef]!.push({ total: r.total, isExempt: r.isExempt });
    }
    const aggs = Object.entries(perStudent).map(([ref, subs]) => ({
      ref,
      ...aggregateTerm(subs.map((s) => ({ subjectId: "x", total: s.total, obtainable: 100, isExempt: s.isExempt })), 2),
    }));
    const avg = (ref: string) => aggs.find((a) => a.ref === ref)!;

    expect(avg("s1")).toMatchObject({ subjectsCount: 3, totalObtained: 230, average: 76.67 });
    expect(avg("s2")).toMatchObject({ subjectsCount: 3, totalObtained: 235, average: 78.33 });
    expect(avg("s3")).toMatchObject({ subjectsCount: 2, totalObtained: 106, average: 53 }); // SCI exempt
    expect(avg("s4")).toMatchObject({ subjectsCount: 3, totalObtained: 174, average: 58 });

    const pos = rank(aggs.map((a) => ({ ref: a.ref, score: a.average })), "standard");
    expect([pos.get("s2"), pos.get("s1"), pos.get("s4"), pos.get("s3")]).toEqual([1, 2, 3, 4]);
  });
});

// ── PROPERTY-BASED INVARIANTS (fast-check) ────────────────────────────────────
const scoreArb = fc.integer({ min: 0, max: 20 });
const examArb = fc.integer({ min: 0, max: 60 });

describe("properties: aggregation", () => {
  it("total always equals caTotal + examScore", () => {
    fc.assert(
      fc.property(scoreArb, scoreArb, examArb, (ca1, ca2, exam) => {
        const agg = aggregateSubject(components, [
          { studentRef: "s", componentKey: "ca1", value: ca1 },
          { studentRef: "s", componentKey: "ca2", value: ca2 },
          { studentRef: "s", componentKey: "exam", value: exam },
        ], 2);
        expect(agg.total).toBe(agg.caTotal + agg.examScore);
        expect(agg.total).toBe(ca1 + ca2 + exam);
      }),
    );
  });

  it("average is null iff no graded subjects, else mean of graded totals", () => {
    fc.assert(
      fc.property(fc.array(fc.record({ total: fc.integer({ min: 0, max: 100 }), exempt: fc.boolean() })), (subs) => {
        const agg = aggregateTerm(subs.map((s) => ({ subjectId: "x", total: s.total, obtainable: 100, isExempt: s.exempt })), 2);
        const graded = subs.filter((s) => !s.exempt);
        if (graded.length === 0) {
          expect(agg.average).toBeNull();
        } else {
          const mean = Math.round((graded.reduce((a, b) => a + b.total, 0) / graded.length + Number.EPSILON) * 100) / 100;
          expect(agg.average).toBe(mean);
          expect(agg.subjectsCount).toBe(graded.length);
        }
      }),
    );
  });
});

describe("properties: ranking", () => {
  const rankableArb = fc.array(
    fc.record({ ref: fc.string({ minLength: 1, maxLength: 4 }), score: fc.integer({ min: 0, max: 100 }) }),
    { minLength: 1, maxLength: 12 },
  ).map((arr) => arr.map((r, i) => ({ ...r, ref: `${r.ref}-${i}` }))); // unique refs

  it("higher score never gets a worse position; equal scores tie", () => {
    fc.assert(
      fc.property(rankableArb, fc.constantFrom("standard" as const, "dense" as const), (items, strategy) => {
        const pos = rank(items, strategy);
        for (const a of items) {
          for (const b of items) {
            const pa = pos.get(a.ref)!;
            const pb = pos.get(b.ref)!;
            if (a.score > b.score) expect(pa).toBeLessThan(pb);
            if (a.score === b.score) expect(pa).toBe(pb);
          }
        }
      }),
    );
  });

  it("dense positions are contiguous 1..k (k = distinct scores); standard tops at 1 and never exceeds n", () => {
    fc.assert(
      fc.property(rankableArb, (items) => {
        const dense = [...rank(items, "dense").values()].filter((p): p is number => p !== null);
        const distinct = new Set(items.map((i) => i.score)).size;
        expect(Math.min(...dense)).toBe(1);
        expect(Math.max(...dense)).toBe(distinct);

        const std = [...rank(items, "standard").values()].filter((p): p is number => p !== null);
        expect(Math.min(...std)).toBe(1);
        expect(Math.max(...std)).toBeLessThanOrEqual(items.length);
      }),
    );
  });
});

describe("properties: grading", () => {
  it("every total in [0,100] resolves to a band that contains it", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (total) => {
        const g = resolveGrade(total, gradeBands);
        expect(g).not.toBeNull();
        const band = gradeBands.find((b) => b.grade === g!.grade)!;
        expect(total).toBeGreaterThanOrEqual(band.min);
        expect(total).toBeLessThanOrEqual(band.max);
      }),
    );
  });
});
