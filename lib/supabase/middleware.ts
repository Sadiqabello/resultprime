import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { TENANT_SLUG_HEADER } from "@/config/constants";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session on every request and returns both the
 * (possibly mutated) response and the authenticated user. Called from the
 * root middleware.ts. Keeping cookie rotation here is required for
 * @supabase/ssr to keep tokens fresh in the App Router.
 *
 * `schoolSlug` (resolved from the subdomain) is forwarded as a request header so
 * server components can theme the login page and assert tenant match (§4.4).
 */
export async function updateSession(request: NextRequest, schoolSlug?: string | null) {
  // Forward the resolved tenant slug; strip any client-supplied value otherwise.
  const requestHeaders = new Headers(request.headers);
  if (schoolSlug) requestHeaders.set(TENANT_SLUG_HEADER, schoolSlug);
  else requestHeaders.delete(TENANT_SLUG_HEADER);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() validates the JWT with the auth server. Do not trust
  // getSession() alone for authorization decisions in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
