import { z } from "zod";

/** Empty string → undefined, so optional fields clear cleanly from a form. */
const blankToUndef = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const hexColor = blankToUndef.refine(
  (v) => v === undefined || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v),
  "Use a hex colour like #7c3aed",
);

/** Per-school settings (branding, policy, flags) — see §4.3 / §4.5. */
export const schoolSettingsSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(120).optional(),
  logoUrl: blankToUndef.refine(
    (v) => v === undefined || /^https?:\/\//i.test(v),
    "Logo must be a URL (http/https)",
  ),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  timezone: z.string().default("Africa/Lagos"),
  locale: z.string().default("en-NG"),
  approvalPolicy: z.enum(["one_step", "two_step"]).default("one_step"),
  feeGatingEnabled: z.boolean().default(false),
});
export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;
