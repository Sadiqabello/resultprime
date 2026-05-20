import { z } from "zod";
import { nonEmptyString } from "@/lib/validation";

export const signInSchema = z.object({
  email: z.string().email(),
  password: nonEmptyString,
});
export type SignInInput = z.infer<typeof signInSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email(),
});
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/**
 * Self-serve signup = register a NEW school (tenant) + its first School Admin.
 * Staff/students/parents are invited by the school, not self-registered (§3).
 */
export const registerSchoolSchema = z
  .object({
    schoolName: nonEmptyString,
    fullName: nonEmptyString,
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterSchoolInput = z.infer<typeof registerSchoolSchema>;
