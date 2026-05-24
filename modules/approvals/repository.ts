import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

/**
 * Approval data access. The unit is a class + term: one approval row
 * (subject_type='class', subject_id=class). Events are append-only.
 */
export const approvalsRepository = {
  async getCurrentTerm(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("terms")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();
  },

  async listClassesLite(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("classes")
      .select("id, name, arm")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("grade_order", { ascending: true })
      .order("name", { ascending: true });
  },

  async listApprovals(schoolId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("approvals")
      .select("id, subject_id, state")
      .eq("school_id", schoolId)
      .eq("subject_type", "class")
      .eq("term_id", termId);
  },

  /** Class ids that have computed term_results for the term. */
  async classesWithResults(schoolId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("term_results")
      .select("class_id")
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  async getApproval(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("approvals")
      .select("id, state")
      .eq("school_id", schoolId)
      .eq("subject_type", "class")
      .eq("subject_id", classId)
      .eq("term_id", termId)
      .maybeSingle();
  },

  /**
   * Apply a validated approval transition atomically (approval row + event log,
   * and on publish the subject/term result visibility) in one DB transaction via
   * the apply_approval_transition() function. State-machine validation and
   * capability checks happen in the service before this is called.
   */
  async applyTransition(args: {
    schoolId: string;
    classId: string;
    termId: string;
    to: string;
    from: string;
    actorId: string;
    actorRole: string | null;
  }) {
    const sb = await createClient();
    return sb.rpc("apply_approval_transition", {
      p_school_id: args.schoolId,
      p_class_id: args.classId,
      p_term_id: args.termId,
      p_to: args.to as Enums<"approval_state">,
      p_from: args.from as Enums<"approval_state">,
      p_actor_id: args.actorId,
      p_actor_role: args.actorRole,
    });
  },
};
