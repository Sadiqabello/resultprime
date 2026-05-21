import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { scoresService, type SheetView } from "@/modules/scores/service";
import {
  buildScoreTemplate,
  parseScoreWorkbook,
  WorkbookParseError,
  type ParsedWorkbook,
  type TemplateComponent,
} from "./xlsx";
import { analyze, type ScoreImportPreview } from "./analyze";

/**
 * Bulk score import (§12). The flow is: download a class-subject-specific
 * template → fill offline → upload → VALIDATE → PREVIEW (a diff, never blind) →
 * CONFIRM (one bulk upsert, all-or-nothing). This module is a thin pipeline: it
 * reads the live sheet context via `scoresService.getSheet` (roster, components,
 * existing scores, lock state), runs the pure `analyze` diff, and delegates the
 * commit to `scoresService.save` — so capability/assignment/lock/range checks
 * and the `score_history` trigger are all reused. No path here bypasses a lock.
 */

// Re-exported so UI/actions import preview types from the service entry point.
export type {
  ScoreImportPreview,
  PreviewRow,
  PreviewCell,
  CellStatus,
  RowStatus,
} from "./analyze";

export interface ScoreImportResult {
  committed: number;
  inserts: number;
  updates: number;
}

const templateComponents = (sheet: SheetView): TemplateComponent[] =>
  sheet.components.map((c) => ({ id: c.id, label: c.label, maxScore: c.maxScore }));

export const importsService = {
  /** Generate the class-subject-specific .xlsx template with the roster pre-filled. */
  async buildTemplate(
    ctx: AuthContext,
    classSubjectId: string,
  ): Promise<Result<{ filename: string; buffer: Buffer }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");

    const sheetRes = await scoresService.getSheet(ctx, classSubjectId);
    if (!sheetRes.ok) return sheetRes;
    const sheet = sheetRes.data;
    if (sheet.components.length === 0) return err("CONFLICT", "Set up your grading system before importing.");

    const buffer = buildScoreTemplate({
      classSubjectId,
      termId: sheet.termId,
      schoolId: ctx.schoolId,
      classLabel: sheet.classLabel,
      subjectName: sheet.subjectName,
      components: templateComponents(sheet),
      students: sheet.students.map((s) => ({ admissionNo: s.admissionNo, name: s.name })),
    });

    const slug = `${sheet.classLabel}-${sheet.subjectName}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return ok({ filename: `scores-${slug}.xlsx`, buffer });
  },

  /** Parse + validate an uploaded sheet and return a diff preview WITHOUT committing. */
  async preview(
    ctx: AuthContext,
    classSubjectId: string,
    file: ArrayBuffer,
  ): Promise<Result<ScoreImportPreview>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");

    const sheetRes = await scoresService.getSheet(ctx, classSubjectId);
    if (!sheetRes.ok) return sheetRes;
    const sheet = sheetRes.data;
    if (sheet.components.length === 0) return err("CONFLICT", "Set up your grading system before importing.");

    let parsed: ParsedWorkbook;
    try {
      parsed = parseScoreWorkbook(file, templateComponents(sheet));
    } catch (e) {
      if (e instanceof WorkbookParseError) return err("VALIDATION", e.message);
      throw e;
    }

    return ok(analyze(sheet, parsed, classSubjectId));
  },

  /**
   * Re-parse + re-validate the file against current DB state and commit the
   * changed cells. Delegates to `scoresService.save`, whose single bulk upsert is
   * atomic (all-or-nothing) and re-checks lock + per-component max.
   */
  async commit(
    ctx: AuthContext,
    classSubjectId: string,
    file: ArrayBuffer,
    fileName?: string,
  ): Promise<Result<ScoreImportResult>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "scores.write")) return err("FORBIDDEN", "Not allowed.");

    const sheetRes = await scoresService.getSheet(ctx, classSubjectId);
    if (!sheetRes.ok) return sheetRes;
    const sheet = sheetRes.data;
    if (sheet.locked) return err("RESULT_LOCKED", "These results are locked. Return or unlock them to import.");
    if (sheet.components.length === 0) return err("CONFLICT", "Set up your grading system before importing.");

    let parsed: ParsedWorkbook;
    try {
      parsed = parseScoreWorkbook(file, templateComponents(sheet));
    } catch (e) {
      if (e instanceof WorkbookParseError) return err("VALIDATION", e.message);
      throw e;
    }

    const preview = analyze(sheet, parsed, classSubjectId);
    if (preview.metaMismatch) {
      return err("CONFLICT", "This sheet was generated for a different class-subject. Download a fresh template.");
    }
    if (preview.summary.errorRows > 0) {
      return err("VALIDATION", `${preview.summary.errorRows} row(s) have errors. Fix them and re-upload.`);
    }

    // Collect only the cells that change.
    const cells = preview.rows
      .filter((r) => r.enrollmentId)
      .flatMap((r) =>
        r.cells
          .filter((c) => c.status === "insert" || c.status === "update")
          .map((c) => ({
            enrollmentId: r.enrollmentId as string,
            assessmentComponentId: c.componentId,
            value: c.newValue as number,
            isAbsent: false,
            isExempt: false,
          })),
      );

    if (cells.length === 0) return err("CONFLICT", "No new scores to import — every value matches what's already saved.");

    const saveRes = await scoresService.save(ctx, { classSubjectId, termId: sheet.termId, cells });
    if (!saveRes.ok) return saveRes;

    const result: ScoreImportResult = {
      committed: cells.length,
      inserts: preview.summary.inserts,
      updates: preview.summary.updates,
    };

    // Audit the import (the score_history trigger already logged each cell change).
    await auditService.record({
      schoolId: ctx.schoolId,
      actorId: ctx.userId,
      action: "scores.import",
      entityType: "class_subject",
      entityId: classSubjectId,
      metadata: { ...result, fileName: fileName ?? null, termId: sheet.termId },
    });
    logger.info("scores.imported", {
      schoolId: ctx.schoolId,
      userId: ctx.userId,
      action: "scores.import",
      classSubjectId,
      ...result,
    });

    return ok(result);
  },
};
