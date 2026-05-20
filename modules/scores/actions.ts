"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { scoresService } from "./service";
import type { SaveScoresInput } from "./schema";

export type SaveScoresResult = { ok: true; saved: number } | { ok: false; error: string };

/** Save scores from the sheet (called with a structured object by the grid). */
export async function saveScores(input: SaveScoresInput): Promise<SaveScoresResult> {
  const ctx = await requireAuth();
  const res = await scoresService.save(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath(`/scores/${input.classSubjectId}`);
  return { ok: true, saved: res.data.saved };
}
