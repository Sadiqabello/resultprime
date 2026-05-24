import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Browser (client component) Supabase client. Carries the user's session via
 * cookies and is subject to Row Level Security. Safe to use in "use client"
 * components. Never holds the service-role key.
 *
 * Return type re-annotated for the @supabase/ssr 0.5.2 ↔ supabase-js 2.106
 * generic skew (see lib/supabase/server.ts) so queries stay typed.
 */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as SupabaseClient<Database>;
}
