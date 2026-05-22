"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { can } from "@/lib/authz";
import { uploadImage } from "@/lib/storage";
import { tenancyService } from "./service";
import type { SchoolSettingsInput } from "./schema";

export type SaveBrandingResult = { ok: true } | { ok: false; error: string };
export type AssetUploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Upload a logo or principal signature; returns the public URL to save. */
export async function uploadBrandingAsset(formData: FormData): Promise<AssetUploadResult> {
  const ctx = await requireAuth();
  if (!ctx.schoolId || !can(ctx, "school.configure")) return { ok: false, error: "You don't have permission to do that." };
  const kind = formData.get("kind") === "signature" ? "signature" : "logo";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image." };
  const res = await uploadImage(ctx.schoolId, kind, file);
  if (!res.ok || !res.url) return { ok: false, error: res.error ?? "Upload failed." };
  return { ok: true, url: res.url };
}

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
