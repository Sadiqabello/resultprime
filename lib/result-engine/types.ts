import type { PromotionStatus, TieStrategy } from "@/config/constants";

/**
 * Pure types for the result engine. The engine takes a snapshot of inputs
 * (raw scores + config + roster) and returns computed results. It performs NO
 * I/O — that is the orchestrator's job (modules/results/service.ts). This keeps
 * the math deterministic, idempotent, and exhaustively unit-testable (§6).
 */

/** A single configured assessment component, e.g. CA1 (max 20) or Exam (max 60). */
export interface AssessmentComponent {
  key: string; // "ca1" | "ca2" | "exam" ...
  label: string;
  maxScore: number;
  isExam: boolean;
}

/** One grade band, e.g. { min:70, max:100, grade:"A1", remark:"Excellent", point:4 }. */
export interface GradeBand {
  min: number;
  max: number;
  grade: string;
  remark: string;
  gradePoint?: number;
}

/** A raw score for one student × one component. */
export interface RawScore {
  studentRef: string; // enrollment id (stable per student per term)
  componentKey: string;
  value: number | null;
  isAbsent?: boolean;
  isExempt?: boolean;
}

/** Snapshot of all config the engine needs — stored on results for reproducibility. */
export interface EngineConfig {
  components: AssessmentComponent[];
  gradeBands: GradeBand[];
  rounding: { dp: 0 | 1 | 2; mode: "half_up" };
  tieStrategy: TieStrategy;
  /** Whether absentees are excluded from positions (true) or counted as 0 (false). */
  excludeAbsentFromRank: boolean;
}

/** Computed result for one student × one subject × term. */
export interface SubjectResult {
  studentRef: string;
  caTotal: number;
  examScore: number;
  total: number;
  grade: string | null;
  gradePoint: number | null;
  remark: string | null;
  isAbsent: boolean;
  isExempt: boolean;
  subjectPosition: number | null;
}

/** A subject's contribution to a student's term aggregate. */
export interface SubjectScoreForTerm {
  subjectId: string;
  total: number;
  obtainable: number;
  isExempt: boolean;
}

/** Computed aggregate for one student × term. */
export interface TermResult {
  studentRef: string;
  subjectsCount: number;
  totalObtainable: number;
  totalObtained: number;
  average: number | null;
  classPosition: number | null;
  classSize: number;
  overallGrade: string | null;
  promotionStatus: PromotionStatus;
}

export interface PromotionRule {
  type: "average_threshold" | "pass_core_subjects";
  minAverage?: number;
}
