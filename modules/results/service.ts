import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  computeClassSubjectResults,
  validateGradeBands,
  type EngineConfig,
  type StudentScores,
} from "@/lib/result-engine";
import { resultsRepository } from "./repository";

/**
 * ResultService — the orchestrator (§6.2). It is the ONLY place that bridges
 * the pure engine and the database:
 *   1. authorize  2. load inputs  3. build the config snapshot  4. validate
 *   5. call the engine  6. persist (upsert)  7. audit
 *
 * The math itself lives in lib/result-engine and stays pure & testable. This
 * function is intentionally explicit about each step so the flow matches §6.3.
 */
export const resultsService = {
  async computeClassSubject(
    ctx: AuthContext,
    args: {
      classSubjectId: string;
      subjectId: string;
      termId: string;
      config: EngineConfig; // built from grading module — see TODO below
    },
  ): Promise<Result<{ count: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.compute")) return err("FORBIDDEN", "Not allowed.");

    // 4. validate config before computing (no overlaps/gaps in grade bands).
    const bandCheck = validateGradeBands(args.config.gradeBands);
    if (!bandCheck.valid) {
      return err("VALIDATION", `Grading config invalid: ${bandCheck.reason}`);
    }

    // 2. load raw scores for this class-subject/term.
    const { data: scoreRows, error } = await resultsRepository.loadScores(
      ctx.schoolId,
      args.classSubjectId,
      args.termId,
    );
    if (error) return err("INTERNAL", error.message);

    // 3. shape into the engine's input (group by enrollment).
    const byStudent = new Map<string, StudentScores>();
    for (const row of scoreRows ?? []) {
      const ref = row.enrollment_id as string;
      const entry = byStudent.get(ref) ?? { studentRef: ref, scores: [] };
      entry.scores.push({
        studentRef: ref,
        componentKey: row.assessment_component_id as string,
        value: row.score as number | null,
        isAbsent: row.is_absent as boolean,
        isExempt: row.is_exempt as boolean,
      });
      byStudent.set(ref, entry);
    }

    // 5. PURE computation — no I/O.
    const results = computeClassSubjectResults([...byStudent.values()], args.config);

    // 6. persist (idempotent upsert) with the config snapshot for reproducibility.
    const { error: upsertError } = await resultsRepository.upsertSubjectResults(
      ctx.schoolId,
      args.classSubjectId,
      args.termId,
      args.subjectId,
      results,
      args.config,
    );
    if (upsertError) return err("INTERNAL", upsertError.message);

    // 7. audit.
    logger.info("results.computed", {
      schoolId: ctx.schoolId,
      userId: ctx.userId,
      action: "results.compute",
      classSubjectId: args.classSubjectId,
      termId: args.termId,
      count: results.length,
    });

    // TODO: build EngineConfig inside the service from gradingService instead of
    // accepting it as an arg, so callers can't pass a mismatched snapshot.
    // TODO: aggregateTerm + class ranking pass to populate term_results.
    return ok({ count: results.length });
  },
};
