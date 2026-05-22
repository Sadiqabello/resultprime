import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { parseSubdomain } from "@/lib/tenant/subdomain";
import { rateLimit } from "@/lib/ratelimit";

/** Brute-force protection on credential endpoints (§9.3). */
const RATE_LIMITED = new Set(["/login", "/signup"]);
const clientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "local";

/**
 * Edge middleware (§8.5). Runs on every request:
 *   1. Resolve the tenant from the subdomain → forward as a request header.
 *   2. Refresh the Supabase session (rotate cookies).
 *   3. Gate protected routes — unauthenticated users → /login.
 *
 * The subdomain only *suggests* the tenant; the authoritative tenant is the JWT
 * claim. The (auth) layout rejects a slug↔JWT mismatch (§4.4). Coarse gating
 * only here — fine-grained authorization is in the service layer, RLS is the
 * database backstop. Never rely on middleware alone for data authorization.
 */
// Cron + webhooks authenticate via a shared secret / signature, not a session,
// so they bypass the session gate (their handlers do their own auth).
const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify", "/api/health", "/api/webhooks", "/api/cron"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit credential POSTs by IP before doing any work.
  if (request.method === "POST" && RATE_LIMITED.has(pathname)) {
    const r = await rateLimit(`auth:${clientIp(request)}:${pathname}`, { max: 10, windowMs: 60_000 });
    if (!r.ok) {
      return new NextResponse("Too many attempts. Please wait a moment and try again.", {
        status: 429,
        headers: { "Retry-After": String(r.retryAfter) },
      });
    }
  }

  const slug = parseSubdomain(request.headers.get("host"), process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "");
  const { response, user } = await updateSession(request, slug);

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
