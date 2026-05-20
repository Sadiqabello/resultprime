"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { resultsService } from "./service";

export type ComputeResult =
  | { ok: true; subjects: number; students: number }
  | { ok: false; error: string };

/**
 * Compute a whole class's results for the current term. For very large schools
 * this should move to a background job (§14.6); inline is fine at class scale.
 */
export async function computeClass(classId: string): Promise<ComputeResult> {
  const ctx = await requireAuth();
  const res = await resultsService.computeClass(ctx, classId);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/results");
  return { ok: true, subjects: res.data.subjects, students: res.data.students };
}
