"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";
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
  // Compute is CPU + DB heavy; cap per-user bursts so it can't be hammered.
  const rl = await rateLimit(`compute:${ctx.userId}`, { max: 20, windowMs: 60_000 });
  if (!rl.ok) return { ok: false, error: "Too many compute requests. Please wait a moment and try again." };
  const res = await resultsService.computeClass(ctx, classId);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/results");
  return { ok: true, subjects: res.data.subjects, students: res.data.students };
}
