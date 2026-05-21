import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { ApprovalState } from "@/config/constants";
import { notificationsService } from "@/modules/notifications/service";
import { approvalsRepository } from "./repository";

const NEXT: Record<ApprovalState, ApprovalState[]> = {
  draft: ["submitted"],
  returned: ["submitted"],
  submitted: ["approved", "returned"],
  l1_approved: ["approved", "returned"],
  approved: ["published", "returned"],
  published: [],
};

export interface ClassApproval {
  classId: string;
  label: string;
  state: ApprovalState;
  computed: boolean;
}

function classLabel(c: { name: string; arm: string | null }) {
  return c.arm ? `${c.name} ${c.arm}` : c.name;
}

async function currentState(schoolId: string, classId: string, termId: string) {
  const { data } = await approvalsRepository.getApproval(schoolId, classId, termId);
  return { id: (data?.id as string | undefined) ?? null, state: (data?.state as ApprovalState | undefined) ?? "draft" };
}

export const approvalsService = {
  async getClassApprovals(ctx: AuthContext): Promise<Result<{ termName: string | null; classes: ClassApproval[] }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.read")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: term } = await approvalsRepository.getCurrentTerm(schoolId);
    if (!term) return ok({ termName: null, classes: [] });
    const termId = term.id as string;

    const [{ data: classes }, { data: approvals }, { data: computedRows }] = await Promise.all([
      approvalsRepository.listClassesLite(schoolId),
      approvalsRepository.listApprovals(schoolId, termId),
      approvalsRepository.classesWithResults(schoolId, termId),
    ]);

    const stateByClass = new Map((approvals ?? []).map((a) => [a.subject_id, a.state as ApprovalState]));
    const computed = new Set((computedRows ?? []).map((r) => r.class_id));

    return ok({
      termName: term.name as string,
      classes: (classes ?? []).map((c) => ({
        classId: c.id,
        label: classLabel(c),
        state: stateByClass.get(c.id) ?? "draft",
        computed: computed.has(c.id),
      })),
    });
  },

  async transition(
    ctx: AuthContext,
    classId: string,
    to: ApprovalState,
  ): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const schoolId = ctx.schoolId;

    // capability per target state
    const need =
      to === "submitted" ? "results.submit" : to === "published" ? "results.publish" : "results.approve";
    if (!can(ctx, need)) return err("FORBIDDEN", "Not allowed.");

    const { data: term } = await approvalsRepository.getCurrentTerm(schoolId);
    if (!term) return err("CONFLICT", "No active term.");
    const termId = term.id as string;

    const { state: from } = await currentState(schoolId, classId, termId);
    if (!NEXT[from].includes(to)) {
      return err("CONFLICT", `Can't move from ${from} to ${to}.`);
    }

    // Submitting requires computed results to exist.
    if (to === "submitted") {
      const { data: computedRows } = await approvalsRepository.classesWithResults(schoolId, termId);
      const has = (computedRows ?? []).some((r) => r.class_id === classId);
      if (!has) return err("CONFLICT", "Compute this class's results before submitting.");
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { state: to };
    if (to === "submitted") {
      fields.submitted_by = ctx.userId;
      fields.submitted_at = now;
    } else if (to === "approved") {
      fields.approved_by = ctx.userId;
      fields.approved_at = now;
    } else if (to === "published") {
      fields.published_at = now;
    }

    const { data: appr, error } = await approvalsRepository.upsertApproval(schoolId, classId, termId, fields);
    if (error || !appr) return err("INTERNAL", error?.message ?? "Could not update approval.");

    await approvalsRepository.insertEvent(schoolId, appr.id as string, from, to, ctx.userId, ctx.roles[0] ?? null);

    // Publishing flips the underlying results to visible.
    if (to === "published") {
      const { data: csIds } = await approvalsRepository.getClassSubjectIds(schoolId, classId, termId);
      await approvalsRepository.setResultsStatus(schoolId, (csIds ?? []).map((c) => c.id), termId, "published");
      await approvalsRepository.setTermResultsStatus(schoolId, classId, termId, "published");
      // Best-effort: notify students/guardians/form-teacher (never blocks publish).
      await notificationsService.notifyResultsPublished({ schoolId, classId, termId, termName: term.name as string });
    }

    logger.info("approvals.transition", { schoolId, userId: ctx.userId, action: `approvals.${to}`, classId, from, to });
    return ok(null);
  },
};
