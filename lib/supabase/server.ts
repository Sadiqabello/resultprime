import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server (Server Component / Server Action / Route Handler) Supabase client.
 * Reads and refreshes the session from httpOnly cookies and is subject to Row
 * Level Security — this is the DEFAULT client for all tenant-scoped work.
 *
 * Tenant isolation is enforced by RLS using the school_id claim in the JWT, so
 * this client can never read another tenant's rows even if a query forgets to
 * filter by school_id. (Defense in depth: repositories still scope explicitly.)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware is refreshing the session (see lib/supabase/middleware.ts).
          }
        },
      },
    },
  );
}
