import { NextResponse, type NextRequest } from "next/server";

/**
 * Cron-triggered recompute / maintenance endpoint (§14.7). Protected by a shared
 * secret — reject anything without the matching bearer token. Heavy work should
 * be enqueued as a background job, not run inline here.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // TODO: enqueue recompute job(s) for active terms; return job ids.
  return NextResponse.json({ ok: true, enqueued: 0 });
}
