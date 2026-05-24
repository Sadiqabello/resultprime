import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { requireWritableTenant } from "@/modules/billing/access";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { saveFeesSchema, type FeeStatus, type SaveFeesInput } from "./schema";
import { feesRepository } from "./repository";

export interface FeeRow {
  enrollmentId: string;
  name: string;
  admissionNo: string;
  status: FeeStatus;
  note: string;
}
export interface ClassFeesView {
  classLabel: string;
  termName: string | null;
  gatingEnabled: boolean;
  rows: FeeRow[];
}

const classLabel = (c?: { name: string; arm: string | null } | null) =>
  c ? (c.arm ? `${c.name} ${c.arm}` : c.name) : "—";

export const feesService = {
  async getClassFees(ctx: AuthContext, classId: string): Promise<Result<ClassFeesView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "fees.manage")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const [{ data: klass }, { data: settings }, { data: term }] = await Promise.all([
      feesRepository.getClassMeta(schoolId, classId),
      feesRepository.getSettings(schoolId),
      feesRepository.getCurrentTerm(schoolId),
    ]);
    const label = classLabel(klass);
    const gatingEnabled = Boolean(settings?.fee_gating_enabled);
    if (!term) return ok({ classLabel: label, termName: null, gatingEnabled, rows: [] });
    const termId = term.id as string;

    const { data: enr } = await feesRepository.loadEnrollments(schoolId, classId, termId);
    const { data: studs } = await feesRepository.loadStudents(schoolId, (enr ?? []).map((e) => e.student_id as string));
    const { data: fees } = await feesRepository.listFeeStatus(schoolId, (enr ?? []).map((e) => e.id as string));

    const studMap = new Map((studs ?? []).map((s) => [s.id, s]));
    const feeMap = new Map((fees ?? []).map((f) => [f.enrollment_id, f]));

    const rows: FeeRow[] = (enr ?? [])
      .map((e) => {
        const s = studMap.get(e.student_id);
        const f = feeMap.get(e.id);
        return {
          enrollmentId: e.id as string,
          name: s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—",
          admissionNo: (s?.admission_no as string) ?? "",
          sortKey: (s?.last_name as string) ?? "",
          status: ((f?.status as FeeStatus) ?? "owing") as FeeStatus,
          note: (f?.note as string | null) ?? "",
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _s, ...r }) => r);

    return ok({ classLabel: label, termName: term.name as string, gatingEnabled, rows });
  },

  async saveClassFees(ctx: AuthContext, input: SaveFeesInput): Promise<Result<{ saved: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "fees.manage")) return err("FORBIDDEN", "Not allowed.");
    const _w = await requireWritableTenant(ctx);
    if (!_w.ok) return _w;
    const schoolId = ctx.schoolId;

    const parsed = saveFeesSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid fee data.");

    const { data: term } = await feesRepository.getCurrentTerm(schoolId);
    if (!term) return err("CONFLICT", "No active term.");

    const { error } = await feesRepository.upsertFees(schoolId, term.id as string, parsed.data, ctx.userId);
    if (error) return err("INTERNAL", error.message);

    await auditService.record({
      schoolId,
      actorId: ctx.userId,
      action: "fees.update",
      entityType: "class",
      entityId: parsed.data.classId,
      metadata: { termId: term.id, students: parsed.data.rows.length },
    });
    logger.info("fees.saved", { schoolId, userId: ctx.userId, classId: parsed.data.classId, count: parsed.data.rows.length });
    return ok({ saved: parsed.data.rows.length });
  },
};
