"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import type { ResendState } from "@/components/ui/resend-setup-button";
import { staffService } from "./service";
import { addStaffSchema, updateStaffSchema } from "./schema";

export type StaffFormState = { ok: true } | { error: string } | null;

export async function resendStaffSetup(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const ctx = await requireAuth();
  const res = await staffService.resendSetupLink(ctx, String(formData.get("id")));
  if (!res.ok) return { error: friendlyMessage(res.error) };
  return {
    ok: true,
    message: res.data.emailSent ? "Setup link sent." : "Couldn't email it — set RESEND_API_KEY to send links.",
  };
}

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

export async function updateStaff(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const ctx = await requireAuth();
  const parsed = updateStaffSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    qualification: formData.get("qualification"),
    isTeaching: formData.get("isTeaching") === "on" || formData.get("isTeaching") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const res = await staffService.update(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/staff");
  revalidatePath(`/staff/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteStaff(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const res = await staffService.remove(ctx, String(formData.get("id")));
  // Throw on failure so the confirm dialog surfaces it instead of falsely
  // reporting "Staff removed".
  if (!res.ok) throw new Error(friendlyMessage(res.error));
  revalidatePath("/staff");
}
