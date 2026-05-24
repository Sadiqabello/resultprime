"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import type { ApprovalState } from "@/config/constants";
import { approvalsService } from "./service";

async function move(formData: FormData, to: ApprovalState) {
  const ctx = await requireAuth();
  const res = await approvalsService.transition(ctx, String(formData.get("classId")), to);
  // Surface failures instead of silently revalidating as if it worked. The
  // confirm dialog (ConfirmSubmit) catches the throw and shows an error toast;
  // a plain form falls through to the error boundary. Never pretend success.
  if (!res.ok) throw new Error(friendlyMessage(res.error));
  // Locking/visibility changed across the app.
  revalidatePath("/approvals");
  revalidatePath("/scores");
  revalidatePath("/results");
}

export async function submitClass(formData: FormData) {
  await move(formData, "submitted");
}
export async function approveClass(formData: FormData) {
  await move(formData, "approved");
}
export async function publishClass(formData: FormData) {
  await move(formData, "published");
}
export async function returnClass(formData: FormData) {
  await move(formData, "returned");
}
