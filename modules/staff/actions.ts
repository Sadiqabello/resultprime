"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { staffService } from "./service";
import { addStaffSchema } from "./schema";

export type StaffFormState = { ok: true } | { error: string } | null;

export async function addStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const ctx = await requireAuth();
  const parsed = addStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    staffNo: formData.get("staffNo"),
    phone: formData.get("phone"),
    qualification: formData.get("qualification"),
    isTeaching: formData.get("isTeaching") === "on" || formData.get("isTeaching") === "true",
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await staffService.add(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/staff");
  return { ok: true };
}

export async function deleteStaff(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await staffService.remove(ctx, String(formData.get("id")));
  revalidatePath("/staff");
}
