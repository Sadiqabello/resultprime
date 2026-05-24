import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
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
 *
 * Return type is pinned to supabase-js's own `SupabaseClient<Database>`: the
 * installed @supabase/ssr (0.5.2) annotates its return with the OLD 3-generic
 * `SupabaseClient<Database, SchemaName, Schema>`, but supabase-js 2.106 reordered
 * those generics, which collapses the schema to `never` and untypes every query.
 * The runtime client is correct; this re-annotation restores accurate typing.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
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
  ) as unknown as SupabaseClient<Database>;
}
