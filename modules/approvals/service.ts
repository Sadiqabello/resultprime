import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import type { ApprovalState } from "@/config/constants";

/**
 * Approval workflow state machine (§6.7). Transitions are the only way results
 * move toward "published"; each transition records an immutable approval_event.
 * `two_step` policy routes submitted → l1_approved (VP) → approved (Principal).
 */
const TRANSITIONS: Record<ApprovalState, ApprovalState[]> = {
  draft: ["submitted"],
  submitted: ["l1_approved", "approved", "returned"],
  l1_approved: ["approved", "returned"],
  approved: ["published", "returned"],
  published: [], // corrections re-open via a separate, audited flow
  returned: ["submitted"],
};

/** Permission required to perform a given transition. */
const REQUIRED: Partial<Record<ApprovalState, Parameters<typeof can>[1]>> = {
  submitted: "results.submit",
  l1_approved: "results.approve",
  approved: "results.approve",
  published: "results.publish",
};

export const approvalsService = {
  canTransition(from: ApprovalState, to: ApprovalState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  },

  async transition(
    ctx: AuthContext,
    args: { from: ApprovalState; to: ApprovalState; subjectId: string; comment?: string },
  ): Promise<Result<{ state: ApprovalState }>> {
    if (!this.canTransition(args.from, args.to)) {
      return err("CONFLICT", `Cannot move from ${args.from} to ${args.to}.`);
    }
    const needed = REQUIRED[args.to];
    if (needed && !can(ctx, needed)) return err("FORBIDDEN", "Not allowed.");

    // TODO: update `approvals` row, append `approval_events`, and on
    // "submitted"/"approved" lock the underlying scores (§6.7).
    return ok({ state: args.to });
  },
};
