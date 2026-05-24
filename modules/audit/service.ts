import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database.types";

/**
 * Application-level audit logging (§13). Complements the DB triggers on `scores`
 * (score_history) and `approval_events`. Call this from services after any
 * sensitive action: result.publish, role.change, grading.update, login,
 * impersonation, config.change, exports.
 *
 * Failures here must NOT break the user action — log and move on.
 */
export const auditService = {
  async record(args: {
    schoolId: string | null;
    actorId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const supabase = await createClient();
      await supabase.from("audit_logs").insert({
        school_id: args.schoolId,
        actor_id: args.actorId,
        action: args.action,
        entity_type: args.entityType ?? null,
        entity_id: args.entityId ?? null,
        metadata: (args.metadata ?? {}) as Json,
      });
    } catch (e) {
      logger.error("audit.write_failed", {
        action: args.action,
        error: (e as Error).message,
      });
    }
  },
};
