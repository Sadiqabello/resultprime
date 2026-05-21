"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { reportsService } from "./service";
import type { SaveExtrasInput } from "./schema";

export type SaveExtrasResult = { ok: true; saved: number } | { ok: false; error: string };

/** Save a class's report extras (class-teacher/principal remarks + attendance). */
export async function saveClassExtras(input: SaveExtrasInput): Promise<SaveExtrasResult> {
  const ctx = await requireAuth();
  const res = await reportsService.saveClassExtras(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath("/reports/remarks");
  return { ok: true, saved: res.data.saved };
}
