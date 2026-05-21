import { z } from "zod";
import { uuid } from "@/lib/validation";

/** One student's report extras: remarks + attendance (stored on term_results). */
export const extrasRowSchema = z
  .object({
    enrollmentId: uuid,
    classTeacherRemark: z.string().trim().max(500).optional().default(""),
    principalRemark: z.string().trim().max(500).optional().default(""),
    attendancePresent: z.number().int().min(0).max(400).nullable().default(null),
    attendanceTotal: z.number().int().min(0).max(400).nullable().default(null),
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
