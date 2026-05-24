import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Authorize a cron/background request by its shared bearer secret (§14.7).
 * Uses a constant-time comparison so the secret can't be recovered by timing
 * the response, and fails closed when CRON_SECRET isn't configured.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
