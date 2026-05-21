"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { cumulativeService } from "./service";

export type ComputeCumulativeResult =
  | { ok: true; students: number; terms: number }
  | { ok: false; error: string };

/** Compute the annual (cumulative) result for a class across the current session. */
export async function computeCumulative(classId: string): Promise<ComputeCumulativeResult> {
  const ctx = await requireAuth();
  const res = await cumulativeService.computeSession(ctx, classId);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath(`/annual`);
  return { ok: true, students: res.data.students, terms: res.data.terms };
}
