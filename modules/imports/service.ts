import "server-only";
import { type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";

/**
 * Bulk import pipeline (§12): download template → fill offline → upload →
 * VALIDATE → PREVIEW (diff) → CONFIRM (single transaction, all-or-nothing) →
 * report. Never import blind; always preview. Tag rows with an import_batch id
 * so an entire import can be rolled back.
 */
export interface ImportRowResult<T> {
  row: number;
  status: "valid" | "warning" | "error";
  message?: string;
  parsed?: T;
}

export interface ImportPreview<T> {
  batchId: string;
  inserts: number;
  updates: number;
  errors: number;
  rows: ImportRowResult<T>[];
}

export const importsService = {
  /** Parse + validate an uploaded sheet and return a preview WITHOUT committing. */
  async preview(ctx: AuthContext, _file: ArrayBuffer): Promise<Result<ImportPreview<unknown>>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    // TODO: parse with SheetJS, validate each row with the target Zod schema,
    // detect duplicates + conflicts, build the diff.
    return ok({ batchId: crypto.randomUUID(), inserts: 0, updates: 0, errors: 0, rows: [] });
  },

  /** Commit a previously-previewed batch in ONE transaction. */
  async commit(ctx: AuthContext, _batchId: string): Promise<Result<{ committed: number }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    // TODO: re-validate, upsert in a transaction, write audit + score_history.
    return ok({ committed: 0 });
  },
};
