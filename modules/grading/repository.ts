import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GradingConfigInput } from "./schema";

/**
 * Grading config data access. For MVP a school has ONE active grading system and
 * ONE active assessment scheme (session_id / level NULL = applies to all).
 * Saving replaces the child rows (bands / components) wholesale — config sets are
 * small and edited as a unit.
 */
export const gradingRepository = {
  async getActiveSystem(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("grading_systems")
      .select("*, grade_bands(*)")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async getActiveScheme(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("assessment_schemes")
      .select("*, assessment_components(*)")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async upsertSystem(
    schoolId: string,
    id: string | null,
    cfg: Pick<GradingConfigInput, "name" | "roundingDp" | "tieStrategy" | "excludeAbsentFromRank" | "passMark">,
  ) {
    const sb = await createClient();
    const row = {
      school_id: schoolId,
      name: cfg.name,
      rounding_dp: cfg.roundingDp,
      tie_strategy: cfg.tieStrategy,
      exclude_absent_from_rank: cfg.excludeAbsentFromRank,
      pass_mark: cfg.passMark,
      is_active: true,
    };
    return id
      ? sb.from("grading_systems").update(row).eq("school_id", schoolId).eq("id", id).select("id").single()
      : sb.from("grading_systems").insert(row).select("id").single();
  },

  async replaceBands(schoolId: string, systemId: string, bands: GradingConfigInput["bands"]) {
    const sb = await createClient();
    await sb.from("grade_bands").delete().eq("school_id", schoolId).eq("grading_system_id", systemId);
    return sb.from("grade_bands").insert(
      bands.map((b, i) => ({
        school_id: schoolId,
        grading_system_id: systemId,
        grade: b.grade,
        min_score: b.min,
        max_score: b.max,
        remark: b.remark ?? "",
        grade_point: b.gradePoint ?? null,
        sort_order: i,
      })),
    );
  },

  async upsertScheme(schoolId: string, id: string | null, totalObtainable: number) {
    const sb = await createClient();
    const row = {
      school_id: schoolId,
      name: "Default scheme",
      total_obtainable: totalObtainable,
      is_active: true,
    };
    return id
      ? sb.from("assessment_schemes").update(row).eq("school_id", schoolId).eq("id", id).select("id").single()
      : sb.from("assessment_schemes").insert(row).select("id").single();
  },

  async replaceComponents(schoolId: string, schemeId: string, components: GradingConfigInput["components"]) {
    const sb = await createClient();
    await sb.from("assessment_components").delete().eq("school_id", schoolId).eq("scheme_id", schemeId);
    return sb.from("assessment_components").insert(
      components.map((c, i) => ({
        school_id: schoolId,
        scheme_id: schemeId,
        key: c.key.toLowerCase(),
        label: c.label,
        max_score: c.maxScore,
        is_exam: c.isExam,
        sort_order: i,
      })),
    );
  },
};
