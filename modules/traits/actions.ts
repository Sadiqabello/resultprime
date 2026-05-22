"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { traitsService } from "./service";
import type { SaveTraitsInput } from "./schema";

export type SaveTraitsResult = { ok: true } | { ok: false; error: string };

export async function saveTraits(input: SaveTraitsInput): Promise<SaveTraitsResult> {
  const ctx = await requireAuth();
  const res = await traitsService.save(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/settings");
  revalidatePath("/reports/remarks");
  return { ok: true };
}
