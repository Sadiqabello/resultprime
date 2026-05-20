"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { gradingService } from "./service";
import type { GradingConfigInput } from "./schema";

export type GradingSaveResult = { ok: true } | { ok: false; error: string };

/** Save the whole grading config (settings + grade scale + components). */
export async function saveGrading(input: GradingConfigInput): Promise<GradingSaveResult> {
  const ctx = await requireAuth();
  const res = await gradingService.saveConfig(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/settings");
  return { ok: true };
}
