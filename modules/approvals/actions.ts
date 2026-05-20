"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import type { ApprovalState } from "@/config/constants";
import { approvalsService } from "./service";

async function move(formData: FormData, to: ApprovalState) {
  const ctx = await requireAuth();
  await approvalsService.transition(ctx, String(formData.get("classId")), to);
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
