"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { tenancyService } from "./service";
import type { SchoolSettingsInput } from "./schema";

export type SaveBrandingResult = { ok: true } | { ok: false; error: string };

/** Update the current school's profile + branding (School Admin only). */
export async function updateSchoolSettings(
  input: SchoolSettingsInput,
): Promise<SaveBrandingResult> {
  const ctx = await requireAuth();
  const res = await tenancyService.saveBranding(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/settings");
  revalidatePath("/(auth)", "layout"); // re-theme the app shell from new colours
  return { ok: true };
}
