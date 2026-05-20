import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Edge middleware (§8.5). Runs on every request:
 *   1. Refresh the Supabase session (rotate cookies).
 *   2. Gate protected routes — unauthenticated users → /login.
 *   3. (Phase 2) Resolve tenant from subdomain and assert it matches the JWT.
 *
 * Coarse gating only — fine-grained, per-resource authorization happens in the
 * service layer, and RLS is the database backstop. Never rely on middleware
 * alone for data authorization.
 */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify", "/api/health", "/api/webhooks"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // TODO(Phase 2): resolve subdomain → school, assert
  // user.app_metadata.school_id === resolvedSchoolId, attach TENANT_HEADER.

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
