/**
 * Sensible starting grading config (editable). The grade scale is the common
 * Nigerian 9-point (WAEC-style) set; components are a 20/20/60 CA-and-exam split
 * summing to 100. Schools tweak these on the settings page (§10.11 — defaults
 * that teach). Pure data, safe to import on client or server.
 */
export const DEFAULT_COMPONENTS = [
  { key: "ca1", label: "1st C.A.", maxScore: 20, isExam: false },
  { key: "ca2", label: "2nd C.A.", maxScore: 20, isExam: false },
  { key: "exam", label: "Examination", maxScore: 60, isExam: true },
];

export const DEFAULT_BANDS = [
  { grade: "A1", min: 75, max: 100, remark: "Excellent", gradePoint: null as number | null },
  { grade: "B2", min: 70, max: 74, remark: "Very Good", gradePoint: null },
  { grade: "B3", min: 65, max: 69, remark: "Good", gradePoint: null },
  { grade: "C4", min: 60, max: 64, remark: "Credit", gradePoint: null },
  { grade: "C5", min: 55, max: 59, remark: "Credit", gradePoint: null },
  { grade: "C6", min: 50, max: 54, remark: "Credit", gradePoint: null },
  { grade: "D7", min: 45, max: 49, remark: "Pass", gradePoint: null },
  { grade: "E8", min: 40, max: 44, remark: "Pass", gradePoint: null },
  { grade: "F9", min: 0, max: 39, remark: "Fail", gradePoint: null },
];

export const DEFAULT_SETTINGS = {
  name: "School grading",
  roundingDp: 2 as 0 | 1 | 2,
  tieStrategy: "standard" as "standard" | "dense",
  excludeAbsentFromRank: true,
  passMark: 40,
};
