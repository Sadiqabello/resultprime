"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { can } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { schoolSettingsSchema, type SchoolSettingsInput } from "./schema";

/** Update the current school's settings (School Admin only). */
export async function updateSchoolSettings(
  input: SchoolSettingsInput,
): Promise<Result<null>> {
  const ctx = await requireAuth();
  if (!can(ctx, "school.configure")) return err("FORBIDDEN", "Not allowed.");

  const parsed = schoolSettingsSchema.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Invalid settings.");

  // TODO: persist via tenancyRepository.updateSettings(ctx.schoolId, parsed.data)
  revalidatePath("/settings");
  return ok(null);
}
