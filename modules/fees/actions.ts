"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { feesService } from "./service";
import type { SaveFeesInput } from "./schema";

export type SaveFeesResult = { ok: true; saved: number } | { ok: false; error: string };

/** Save fee-clearance statuses for a class's current-term students. */
export async function saveClassFees(input: SaveFeesInput): Promise<SaveFeesResult> {
  const ctx = await requireAuth();
  const res = await feesService.saveClassFees(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/fees");
  return { ok: true, saved: res.data.saved };
}
