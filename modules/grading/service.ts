import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { validateGradeBands, type EngineConfig } from "@/lib/result-engine";
import { gradingConfigSchema, type GradingConfigInput } from "./schema";
import { gradingRepository } from "./repository";
import { DEFAULT_BANDS, DEFAULT_COMPONENTS, DEFAULT_SETTINGS } from "./defaults";

/** Shape the editor + page consume. Numbers as numbers; ready to render. */
export interface GradingConfigView {
  configured: boolean;
  name: string;
  roundingDp: number;
  tieStrategy: "standard" | "dense";
  excludeAbsentFromRank: boolean;
  passMark: number;
  bands: { grade: string; min: number; max: number; remark: string; gradePoint: number | null }[];
  components: { key: string; label: string; maxScore: number; isExam: boolean }[];
}

export const gradingService = {
  /** Current config, or the editable defaults when a school hasn't set one yet. */
  async getConfig(ctx: AuthContext): Promise<Result<GradingConfigView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");

    const [{ data: sys }, { data: scheme }] = await Promise.all([
      gradingRepository.getActiveSystem(ctx.schoolId),
      gradingRepository.getActiveScheme(ctx.schoolId),
    ]);

    if (!sys) {
      return ok({
        configured: false,
        ...DEFAULT_SETTINGS,
        bands: DEFAULT_BANDS.map((b) => ({ ...b })),
        components: DEFAULT_COMPONENTS.map((c) => ({ ...c })),
      });
    }

    const bands = (sys.grade_bands ?? [])
      .slice()
      .sort((a: { min_score: number }, b: { min_score: number }) => b.min_score - a.min_score)
      .map((b: { grade: string; min_score: number; max_score: number; remark: string; grade_point: number | null }) => ({
        grade: b.grade,
        min: b.min_score,
        max: b.max_score,
        remark: b.remark ?? "",
        gradePoint: b.grade_point,
      }));

    const components = (scheme?.assessment_components ?? [])
      .slice()
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((c: { key: string; label: string; max_score: number; is_exam: boolean }) => ({
        key: c.key,
        label: c.label,
        maxScore: c.max_score,
        isExam: c.is_exam,
      }));

    return ok({
      configured: true,
      name: sys.name,
      roundingDp: sys.rounding_dp,
      tieStrategy: sys.tie_strategy,
      excludeAbsentFromRank: sys.exclude_absent_from_rank,
      passMark: Number(sys.pass_mark),
      bands: bands.length ? bands : DEFAULT_BANDS.map((b) => ({ ...b })),
      components: components.length ? components : DEFAULT_COMPONENTS.map((c) => ({ ...c })),
    });
  },

  /** Active assessment components WITH their DB ids — scores reference these ids. */
  async getActiveComponents(
    ctx: AuthContext,
  ): Promise<Result<{ id: string; key: string; label: string; maxScore: number; isExam: boolean }[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const { data: scheme, error } = await gradingRepository.getActiveScheme(ctx.schoolId);
    if (error) return err("INTERNAL", error.message);
    const components = (scheme?.assessment_components ?? [])
      .slice()
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((c: { id: string; key: string; label: string; max_score: number; is_exam: boolean }) => ({
        id: c.id,
        key: c.key,
        label: c.label,
        maxScore: c.max_score,
        isExam: c.is_exam,
      }));
    return ok(components);
  },

  async saveConfig(ctx: AuthContext, input: GradingConfigInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "grading.manage")) return err("FORBIDDEN", "Not allowed.");

    const parsed = gradingConfigSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid grading config.");
    const cfg = parsed.data;

    // The engine's own validator — bands must cover 0..100 with no gaps/overlaps.
    const bandCheck = validateGradeBands(
      cfg.bands.map((b) => ({ min: b.min, max: b.max, grade: b.grade, remark: b.remark ?? "" })),
    );
    if (!bandCheck.valid) return err("VALIDATION", bandCheck.reason ?? "Invalid grade bands.");

    if (!cfg.components.some((c) => c.isExam)) {
      return err("VALIDATION", "Mark at least one component as the exam.");
    }

    const { data: existingSys } = await gradingRepository.getActiveSystem(ctx.schoolId);
    const sysRes = await gradingRepository.upsertSystem(ctx.schoolId, existingSys?.id ?? null, cfg);
    if (sysRes.error || !sysRes.data) return err("INTERNAL", sysRes.error?.message ?? "Could not save grading system.");
    const systemId = sysRes.data.id as string;

    const bandRes = await gradingRepository.replaceBands(ctx.schoolId, systemId, cfg.bands);
    if (bandRes.error) return err("INTERNAL", bandRes.error.message);

    const { data: existingScheme } = await gradingRepository.getActiveScheme(ctx.schoolId);
    const total = cfg.components.reduce((s, c) => s + c.maxScore, 0);
    const schemeRes = await gradingRepository.upsertScheme(ctx.schoolId, existingScheme?.id ?? null, total);
    if (schemeRes.error || !schemeRes.data) return err("INTERNAL", schemeRes.error?.message ?? "Could not save scheme.");

    const compRes = await gradingRepository.replaceComponents(ctx.schoolId, schemeRes.data.id as string, cfg.components);
    if (compRes.error) return err("INTERNAL", compRes.error.message);

    return ok(null);
  },

  /**
   * Build the EngineConfig snapshot the result engine consumes. Loads the active
   * system + scheme; falls back to defaults so computation never breaks pre-setup.
   */
  async buildEngineConfig(ctx: AuthContext): Promise<Result<EngineConfig>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const view = await this.getConfig(ctx);
    if (!view.ok) return view;
    const c = view.data;
    return ok({
      components: c.components,
      gradeBands: c.bands.map((b) => ({
        min: b.min,
        max: b.max,
        grade: b.grade,
        remark: b.remark,
        gradePoint: b.gradePoint ?? undefined,
      })),
      rounding: { dp: (c.roundingDp as 0 | 1 | 2) ?? 2, mode: "half_up" },
      tieStrategy: c.tieStrategy,
      excludeAbsentFromRank: c.excludeAbsentFromRank,
    });
  },
};
