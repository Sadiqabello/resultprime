import { NextResponse, type NextRequest } from "next/server";
import { recomputeActive } from "@/modules/results/system";
import { isAuthorizedCron } from "@/lib/cron";
import { logger } from "@/lib/logger";

/**
 * Cron-triggered recompute (§6.8, §14.7). Re-runs the result engine for every
 * already-computed class in each active school's current term (idempotent).
 * Protected by a shared secret. Optional JSON body { schoolId } scopes it to one
 * school. For very large estates, move to a queue with progress reporting.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  let schoolId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.schoolId === "string") schoolId = body.schoolId;
  } catch {
    /* no body → recompute all active schools */
  }

  try {
    const result = await recomputeActive(schoolId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("cron.recompute_failed", { error: (e as Error).message });
    return new NextResponse("Recompute failed", { status: 500 });
  }
}
