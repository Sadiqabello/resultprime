import { z } from "zod";
import { scoreValue, uuid } from "@/lib/validation";

/** One cell of the score sheet. Bound to a component max at the service layer. */
export const scoreCellSchema = z.object({
  enrollmentId: uuid,
  assessmentComponentId: uuid,
  value: scoreValue.nullable(),
  isAbsent: z.boolean().default(false),
  isExempt: z.boolean().default(false),
});

export const saveScoresSchema = z.object({
  classSubjectId: uuid,
  termId: uuid,
  cells: z.array(scoreCellSchema).min(1),
});
export type SaveScoresInput = z.infer<typeof saveScoresSchema>;
