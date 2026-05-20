import "server-only";
import { createClient } from "@/lib/supabase/server";

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

  async upsertApproval(
    schoolId: string,
    classId: string,
    termId: string,
    fields: Record<string, unknown>,
  ) {
    const sb = await createClient();
    return sb
      .from("approvals")
      .upsert(
        { school_id: schoolId, subject_type: "class", subject_id: classId, term_id: termId, ...fields },
        { onConflict: "school_id,subject_type,subject_id,term_id" },
      )
      .select("id")
      .single();
  },

  async insertEvent(
    schoolId: string,
    approvalId: string,
    fromState: string | null,
    toState: string,
    actorId: string,
    actorRole: string | null,
    comment?: string,
  ) {
    const sb = await createClient();
    return sb.from("approval_events").insert({
      school_id: schoolId,
      approval_id: approvalId,
      from_state: fromState,
      to_state: toState,
      actor_id: actorId,
      actor_role: actorRole,
      comment: comment ?? null,
    });
  },

  async getClassSubjectIds(schoolId: string, classId: string, termId: string) {
    const sb = await createClient();
    return sb
      .from("class_subjects")
      .select("id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId)
      .is("deleted_at", null);
  },

  async setResultsStatus(schoolId: string, classSubjectIds: string[], termId: string, status: string) {
    const sb = await createClient();
    if (classSubjectIds.length === 0) return { error: null };
    return sb
      .from("results")
      .update({ status })
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .in("class_subject_id", classSubjectIds);
  },

  async setTermResultsStatus(schoolId: string, classId: string, termId: string, status: string) {
    const sb = await createClient();
    const fields: Record<string, unknown> = { status };
    if (status === "published") fields.published_at = new Date().toISOString();
    return sb
      .from("term_results")
      .update(fields)
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("term_id", termId);
  },
};
