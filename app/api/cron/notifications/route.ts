import { NextResponse, type NextRequest } from "next/server";
import { deliverPending } from "@/modules/notifications/delivery";
import { isAuthorizedCron } from "@/lib/cron";

/**
 * Cron-triggered notification delivery worker (§14.7). Sends pending
 * email/WhatsApp/SMS notifications. Protected by a shared secret — reject
 * anything without the matching bearer token. Schedule via host cron / Supabase
 * pg_cron hitting this endpoint every few minutes.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await deliverPending();
  return NextResponse.json({ ok: true, ...result });
}
