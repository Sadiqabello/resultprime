import { NextResponse, type NextRequest } from "next/server";
import { runDunning } from "@/modules/billing/dunning";
import { logger } from "@/lib/logger";

/**
 * Daily billing dunning (§2.3). Emails trial/subscription reminders on a fixed
 * day-schedule. Account locking itself is computed live from the entitlement, so
 * this job is NOT required for access control — it only nudges. Protected by the
 * shared CRON_SECRET. Schedule once per day (e.g. Vercel cron / Upstash).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const result = await runDunning();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("cron.billing_failed", { error: (e as Error).message });
    return new NextResponse("Dunning failed", { status: 500 });
  }
}
