import { z } from "zod";
import { uuid } from "@/lib/validation";

export const FEE_STATUSES = ["cleared", "owing", "partial"] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];

export const feeRowSchema = z.object({
  enrollmentId: uuid,
  status: z.enum(FEE_STATUSES),
  note: z.string().trim().max(300).optional().default(""),
});

export const saveFeesSchema = z.object({
  classId: uuid,
  rows: z.array(feeRowSchema).min(1),
});
export type SaveFeesInput = z.infer<typeof saveFeesSchema>;
