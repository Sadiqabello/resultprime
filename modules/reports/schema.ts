import { z } from "zod";
import { uuid } from "@/lib/validation";

/** One student's report extras: remarks + attendance + trait ratings (on term_results). */
export const extrasRowSchema = z
  .object({
    enrollmentId: uuid,
    classTeacherRemark: z.string().trim().max(500).optional().default(""),
    principalRemark: z.string().trim().max(500).optional().default(""),
    attendancePresent: z.number().int().min(0).max(400).nullable().default(null),
    attendanceTotal: z.number().int().min(0).max(400).nullable().default(null),
    // trait name → rating 1..5
    traitRatings: z.record(z.string(), z.number().int().min(1).max(5)).optional().default({}),
  })
  .refine(
    (r) => r.attendancePresent == null || r.attendanceTotal == null || r.attendancePresent <= r.attendanceTotal,
    { message: "Days present cannot exceed total days", path: ["attendancePresent"] },
  );

export const saveExtrasSchema = z.object({
  classId: uuid,
  rows: z.array(extrasRowSchema).min(1),
});
export type SaveExtrasInput = z.infer<typeof saveExtrasSchema>;
