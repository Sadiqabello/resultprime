"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { resultsService } from "./service";
import type { EngineConfig } from "@/lib/result-engine";
import type { Result } from "@/lib/errors";

/**
 * Trigger computation for one class-subject. For whole-class or whole-school
 * recomputes, enqueue a background job instead of running inline (§14.6).
 */
export async function computeClassSubjectResults(args: {
  classSubjectId: string;
  subjectId: string;
  termId: string;
  config: EngineConfig;
}): Promise<Result<{ count: number }>> {
  const ctx = await requireAuth();
  const result = await resultsService.computeClassSubject(ctx, args);
  if (result.ok) revalidatePath("/results");
  return result;
}
