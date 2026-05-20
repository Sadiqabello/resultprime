import { z } from "zod";
import { nonEmptyString } from "@/lib/validation";

/**
 * One screen saves the whole grading config: computation settings + the grade
 * scale (bands) + the assessment structure (components). Numbers are coerced so
 * the same schema validates both client objects and any string-y input.
 */
export const bandInputSchema = z
  .object({
    grade: nonEmptyString,
    min: z.coerce.number().min(0).max(100),
    max: z.coerce.number().min(0).max(100),
    remark: z.string().trim().default(""),
    gradePoint: z.coerce.number().min(0).max(100).nullable().optional(),
  })
  .refine((b) => b.min <= b.max, { message: "Band min must be ≤ max", path: ["max"] });

export const componentInputSchema = z.object({
  key: nonEmptyString.regex(/^[a-z0-9_]+$/i, "Use letters, numbers or underscore"),
  label: nonEmptyString,
  maxScore: z.coerce.number().positive().max(1000),
  isExam: z.boolean().default(false),
});

export const gradingConfigSchema = z.object({
  name: nonEmptyString.default("School grading"),
  roundingDp: z.coerce.number().int().min(0).max(2).default(2),
  tieStrategy: z.enum(["standard", "dense"]).default("standard"),
  excludeAbsentFromRank: z.boolean().default(true),
  passMark: z.coerce.number().min(0).max(100).default(40),
  bands: z.array(bandInputSchema).min(1, "Add at least one grade band"),
  components: z.array(componentInputSchema).min(1, "Add at least one component"),
});

export type GradingConfigInput = z.infer<typeof gradingConfigSchema>;
