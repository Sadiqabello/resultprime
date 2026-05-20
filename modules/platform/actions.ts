"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { platformService } from "./service";
import { createSchoolSchema } from "./schema";

export type PlatformFormState = { ok: true; message: string } | { error: string } | null;

export async function createSchool(
  _prev: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const ctx = await requireAuth();
  const parsed = createSchoolSchema.safeParse({
    name: formData.get("name"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await platformService.createSchool(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/schools");
  return {
    ok: true,
    message: res.data.adminInvited
      ? "School created and an invite was sent to the admin."
      : "School created. Invite an admin from the school's Staff page when ready.",
  };
}

export async function setSchoolStatus(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await platformService.setStatus(ctx, String(formData.get("id")), String(formData.get("status")));
  revalidatePath("/schools");
}
