import { z } from "zod";

/** Per-school settings (branding, policy, flags) — see §4.3 / §4.5. */
export const schoolSettingsSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  timezone: z.string().default("Africa/Lagos"),
  locale: z.string().default("en-NG"),
  approvalPolicy: z.enum(["one_step", "two_step"]).default("one_step"),
  feeGatingEnabled: z.boolean().default(false),
});
export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;
