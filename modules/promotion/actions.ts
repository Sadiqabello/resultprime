"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { promotionService, type PromotionResult } from "./service";

export type PromoteResult = { ok: true; result: PromotionResult } | { ok: false; error: string };

/** Promote a class's students into a chosen next-session term. */
export async function promoteClass(classId: string, targetTermId: string): Promise<PromoteResult> {
  const ctx = await requireAuth();
  if (!targetTermId) return { ok: false, error: "Choose the session/term to promote into." };
  const res = await promotionService.promoteClass(ctx, classId, targetTermId);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/annual");
  revalidatePath("/students");
  return { ok: true, result: res.data };
}
