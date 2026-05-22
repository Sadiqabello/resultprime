import { z } from "zod";
import { nonEmptyString, optionalString } from "@/lib/validation";

/** Roles a School Admin can grant when adding staff. */
export const ASSIGNABLE_ROLES = [
  "teacher",
  "form_teacher",
  "exam_officer",
  "principal",
  "vice_principal",
  "bursary",
  "school_admin",
] as const;

export const ROLE_LABELS: Record<(typeof ASSIGNABLE_ROLES)[number], string> = {
  teacher: "Teacher",
  form_teacher: "Form Teacher",
  exam_officer: "Exam Officer",
  principal: "Principal",
  vice_principal: "Vice Principal",
  bursary: "Bursary",
  school_admin: "School Admin",
};

import { uuid } from "@/lib/validation";

/** Edit basic staff details (role/staff-no changes are handled separately). */
export const updateStaffSchema = z.object({
  id: uuid,
  fullName: nonEmptyString,
  phone: optionalString,
  qualification: optionalString,
  isTeaching: z.coerce.boolean().default(true),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const addStaffSchema = z.object({
  fullName: nonEmptyString,
  staffNo: nonEmptyString,
  phone: optionalString,
  qualification: optionalString,
  isTeaching: z.coerce.boolean().default(true),
  // Optional: providing an email invites them as a login user with this role.
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  role: z.enum(ASSIGNABLE_ROLES).default("teacher"),
});
export type AddStaffInput = z.infer<typeof addStaffSchema>;
