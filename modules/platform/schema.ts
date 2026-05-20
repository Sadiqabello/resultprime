import { z } from "zod";
import { nonEmptyString, optionalString } from "@/lib/validation";

/** Super admin onboarding a tenant. Admin email is optional (invite now or later). */
export const createSchoolSchema = z.object({
  name: nonEmptyString,
  adminName: optionalString,
  adminEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
