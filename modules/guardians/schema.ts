import { z } from "zod";
import { nonEmptyString, optionalString, uuid } from "@/lib/validation";

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined),
  z.string().email("Enter a valid email").optional(),
);

/** Add a guardian to a student, optionally creating a parent login. */
export const addGuardianSchema = z
  .object({
    studentId: uuid,
    fullName: nonEmptyString,
    email: optionalEmail,
    phone: optionalString,
    relationship: optionalString,
    isPrimary: z.boolean().default(false),
    createLogin: z.boolean().default(false),
  })
  .refine((d) => !d.createLogin || !!d.email, {
    message: "An email is required to create a parent login",
    path: ["email"],
  });
export type AddGuardianInput = z.infer<typeof addGuardianSchema>;
