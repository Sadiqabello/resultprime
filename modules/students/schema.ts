import { z } from "zod";
import { nonEmptyString, optionalString, uuid } from "@/lib/validation";

const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v : undefined),
  z.string().date().optional(),
);
const optionalGender = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.enum(["male", "female"]).optional(),
);

/**
 * Adding a student also enrols them — so a class is required. The enrolment for
 * the current term is what scores attach to (§5.3).
 */
export const createStudentSchema = z.object({
  admissionNo: nonEmptyString,
  firstName: nonEmptyString,
  lastName: nonEmptyString,
  otherNames: optionalString,
  gender: optionalGender,
  dateOfBirth: optionalDate,
  classId: uuid,
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
