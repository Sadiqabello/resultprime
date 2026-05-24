import { describe, it, expect } from "vitest";
import {
  computeClassSubjectResults,
  resolveGrade,
  validateGradeBands,
  aggregateTerm,
  rank,
  type EngineConfig,
} from "@/lib/result-engine";

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

describe("aggregate + grade", () => {
  it("sums CA + exam into a total and maps to the right grade", () => {
    const [r] = computeClassSubjectResults(
      [{ studentRef: "s1", scores: [
        { studentRef: "s1", componentKey: "ca1", value: 18 },
        { studentRef: "s1", componentKey: "ca2", value: 17 },
        { studentRef: "s1", componentKey: "exam", value: 55 },
      ] }],
      config,
    );
    expect(r!.caTotal).toBe(35);
    expect(r!.examScore).toBe(55);
    expect(r!.total).toBe(90);
    expect(r!.grade).toBe("A1");
    expect(r!.subjectPosition).toBe(1);
  });
});

describe("grade boundaries", () => {
  it("is inclusive on band edges (40 is a Pass, 39 is a Fail)", () => {
    expect(resolveGrade(40, gradeBands)?.grade).toBe("D7");
    expect(resolveGrade(39, gradeBands)?.grade).toBe("F9");
    expect(resolveGrade(100, gradeBands)?.grade).toBe("A1");
  });
});

describe("validateGradeBands", () => {
  it("accepts a clean, gap-free band set", () => {
    expect(validateGradeBands(gradeBands).valid).toBe(true);
  });
  it("rejects bands that leave a gap", () => {
    const gapped = gradeBands.filter((b) => b.grade !== "C4");
    expect(validateGradeBands(gapped).valid).toBe(false);
  });
});

describe("ranking with ties", () => {
  const items = [
    { ref: "a", score: 90 },
    { ref: "b", score: 80 },
    { ref: "c", score: 80 },
    { ref: "d", score: 70 },
  ];
  it("standard ranking leaves a gap after a tie (1,2,2,4)", () => {
    const p = rank(items, "standard");
    expect([p.get("a"), p.get("b"), p.get("c"), p.get("d")]).toEqual([1, 2, 2, 4]);
  });
  it("dense ranking leaves no gap (1,2,2,3)", () => {
    const p = rank(items, "dense");
    expect([p.get("a"), p.get("b"), p.get("c"), p.get("d")]).toEqual([1, 2, 2, 3]);
  });
  it("excludes absentees from positions", () => {
    const p = rank([{ ref: "a", score: 90 }, { ref: "x", score: null, excluded: true }]);
    expect(p.get("a")).toBe(1);
    expect(p.get("x")).toBeNull();
  });
});

describe("term aggregate", () => {
  it("averages graded subjects and excludes exempt ones", () => {
    const agg = aggregateTerm(
      [
        { subjectId: "math", total: 90, obtainable: 100, isExempt: false },
        { subjectId: "eng", total: 60, obtainable: 100, isExempt: false },
        { subjectId: "fr", total: 0, obtainable: 100, isExempt: true },
      ],
      2,
    );
    expect(agg.subjectsCount).toBe(2);
    expect(agg.totalObtained).toBe(150);
    expect(agg.average).toBe(75);
  });
  it("returns null average with no graded subjects (no divide-by-zero)", () => {
    expect(aggregateTerm([], 2).average).toBeNull();
  });
  it("computes a true percentage when subjects have different obtainable marks", () => {
    const agg = aggregateTerm(
      [
        { subjectId: "a", total: 80, obtainable: 100, isExempt: false },
        { subjectId: "b", total: 40, obtainable: 50, isExempt: false },
      ],
      2,
    );
    // 120 of 150 obtainable = 80% (a naive mean of subject scores would be 60).
    expect(agg.totalObtainable).toBe(150);
    expect(agg.average).toBe(80);
  });
});
