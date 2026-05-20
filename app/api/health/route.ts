import { NextResponse } from "next/server";

/** Liveness probe for uptime monitoring (§16.5). Keep it cheap and unauthenticated. */
export async function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
