import { z } from "zod";
import { nonEmptyString, optionalString, uuid } from "@/lib/validation";
import { SCHOOL_LEVELS } from "@/config/constants";

/** Empty form date -> undefined; otherwise validate YYYY-MM-DD. */
const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v : undefined),
  z.string().date().optional(),
);

export const createSessionSchema = z.object({
  name: nonEmptyString, // e.g. "2025/2026"
  startsOn: optionalDate,
  endsOn: optionalDate,
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const createClassSchema = z.object({
  name: nonEmptyString, // e.g. "JSS 1"
  level: z.enum(SCHOOL_LEVELS),
  arm: optionalString, // e.g. "A"
  gradeOrder: z.coerce.number().int().min(0).max(99).default(0),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const createSubjectSchema = z.object({
  name: nonEmptyString,
  code: nonEmptyString,
  category: z.enum(["core", "elective"]).default("core"),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

/** Per-class subject offering + teacher assignment for the current term. */
export const saveAssignmentSchema = z.object({
  classId: uuid,
  items: z.array(
    z.object({
      subjectId: uuid,
      offered: z.boolean(),
      teacherId: uuid.nullable(),
    }),
  ),
});
export type SaveAssignmentInput = z.infer<typeof saveAssignmentSchema>;

/** Standard 3-term layout created automatically with each new session. */
export const STANDARD_TERMS = [
  { name: "First", sequence: 1 },
  { name: "Second", sequence: 2 },
  { name: "Third", sequence: 3 },
] as const;

export const idSchema = z.object({ id: uuid });
