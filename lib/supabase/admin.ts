import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client. **BYPASSES Row Level Security.**
 *
 * Use ONLY in trusted server code that has no per-user context and genuinely
 * must cross tenants or act as the system:
 *   - Super Admin / platform operations (always audited, always explicit school_id)
 *   - Background jobs & cron (recompute, batch PDF, notifications)
 *   - Provisioning users / setting JWT app_metadata claims
 *
 * The `server-only` import guarantees this module can never be bundled into
 * client code. Always pass an explicit school_id filter and write an audit log
 * entry when using it.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
