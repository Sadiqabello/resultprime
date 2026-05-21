import type { SheetView } from "@/modules/scores/service";
import type { ParsedWorkbook } from "./xlsx";

/**
 * Pure validation + diff for the score importer (§12.3 — never import blind).
 * Given the live score sheet (roster, components, existing scores, lock state)
 * and a parsed workbook, produce a row-by-row preview of exactly what would
 * change. No I/O — unit-tested directly, and re-run on commit before any write.
 */

export type CellStatus = "insert" | "update" | "unchanged" | "skip" | "error";
export type RowStatus = "valid" | "warning" | "error";

export interface PreviewCell {
  componentId: string;
  label: string;
  oldValue: number | null;
  newValue: number | null;
  status: CellStatus;
  message?: string;
}
export interface PreviewRow {
  rowNumber: number;
  admissionNo: string;
  name: string;
  enrollmentId: string | null;
  status: RowStatus;
  message?: string;
  cells: PreviewCell[];
}
export interface ScoreImportPreview {
  classSubjectId: string;
  classLabel: string;
  subjectName: string;
  termName: string;
  locked: boolean;
  metaMismatch: boolean;
  missingComponents: string[]; // labels of components with no column in the file
  components: { id: string; label: string; maxScore: number }[];
  rows: PreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    inserts: number;
    updates: number;
    unchanged: number;
  };
  canCommit: boolean;
}

/** Parse a raw cell into a number, or describe why it can't be one. */
export function parseScore(
  raw: string | number | null,
  max: number,
): { value: number | null; error?: string } {
  if (raw === null || String(raw).trim() === "") return { value: null }; // blank = skip
  const n = Number(String(raw).trim());
  if (Number.isNaN(n)) return { value: null, error: "Not a number" };
  if (n < 0) return { value: null, error: "Negative" };
  if (n > max) return { value: null, error: `Over ${max}` };
  return { value: n };
}

export function analyze(
  sheet: SheetView,
  parsed: ParsedWorkbook,
  targetClassSubjectId: string,
): ScoreImportPreview {
  const maxById = new Map(sheet.components.map((c) => [c.id, c.maxScore]));
  const labelById = new Map(sheet.components.map((c) => [c.id, c.label]));
  const roster = new Map(
    sheet.students.map((s) => [s.admissionNo, { enrollmentId: s.enrollmentId, name: s.name }]),
  );

  const metaMismatch =
    parsed.meta.classSubjectId != null && parsed.meta.classSubjectId !== targetClassSubjectId;
  const missingComponents = parsed.missingComponentIds.map((id) => labelById.get(id) ?? id);

  const seen = new Set<string>();
  let inserts = 0;
  let updates = 0;
  let unchanged = 0;
  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;

  const rows: PreviewRow[] = parsed.rows.map((pr) => {
    const match = pr.admissionNo ? roster.get(pr.admissionNo) : undefined;
    const cells: PreviewCell[] = [];
    let rowHasError = false;
    let rowHasChange = false;

    // Row-level identity problems short-circuit the cell diff.
    let rowMessage: string | undefined;
    if (!pr.admissionNo) {
      rowHasError = true;
      rowMessage = "Missing admission number";
    } else if (!match) {
      rowHasError = true;
      rowMessage = "No student with this admission number in this class";
    } else if (seen.has(pr.admissionNo)) {
      rowHasError = true;
      rowMessage = "Duplicate row for this student";
    }
    if (pr.admissionNo) seen.add(pr.admissionNo);

    for (const c of pr.cells) {
      const max = maxById.get(c.componentId) ?? Infinity;
      const label = labelById.get(c.componentId) ?? "—";
      const { value, error } = parseScore(c.raw, max);

      if (error) {
        cells.push({ componentId: c.componentId, label, oldValue: null, newValue: null, status: "error", message: error });
        rowHasError = true;
        continue;
      }
      if (value === null) {
        cells.push({ componentId: c.componentId, label, oldValue: null, newValue: null, status: "skip" });
        continue;
      }
      // Identity errors above mean we can't resolve old values — flag the cell too.
      if (!match) {
        cells.push({ componentId: c.componentId, label, oldValue: null, newValue: value, status: "error" });
        continue;
      }
      const old = sheet.scores[`${match.enrollmentId}:${c.componentId}`] ?? null;
      let status: CellStatus;
      if (old === null) {
        status = "insert";
        inserts++;
        rowHasChange = true;
      } else if (old !== value) {
        status = "update";
        updates++;
        rowHasChange = true;
      } else {
        status = "unchanged";
        unchanged++;
      }
      cells.push({ componentId: c.componentId, label, oldValue: old, newValue: value, status });
    }

    let status: RowStatus;
    if (rowHasError) {
      status = "error";
      errorRows++;
    } else if (rowHasChange) {
      status = "valid";
      validRows++;
    } else {
      status = "warning"; // matched but nothing to change (all blank / unchanged)
      warningRows++;
    }

    return {
      rowNumber: pr.rowNumber,
      admissionNo: pr.admissionNo,
      name: match?.name ?? pr.name,
      enrollmentId: match?.enrollmentId ?? null,
      status,
      message: rowMessage,
      cells,
    };
  });

  const canCommit = !sheet.locked && !metaMismatch && errorRows === 0 && inserts + updates > 0;

  return {
    classSubjectId: targetClassSubjectId,
    classLabel: sheet.classLabel,
    subjectName: sheet.subjectName,
    termName: sheet.termName,
    locked: sheet.locked,
    metaMismatch,
    missingComponents,
    components: sheet.components.map((c) => ({ id: c.id, label: c.label, maxScore: c.maxScore })),
    rows,
    summary: { totalRows: rows.length, validRows, warningRows, errorRows, inserts, updates, unchanged },
    canCommit,
  };
}
