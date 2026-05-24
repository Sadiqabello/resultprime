import "server-only";
import * as XLSX from "xlsx";

/**
 * SheetJS-specific building & parsing for the bulk score importer (§12). This is
 * the ONLY module that imports `xlsx`; everything else works with the plain
 * structures below. Parsing is purely structural — semantic validation (ranges,
 * known students, locks) lives in the service so it stays close to the DB state.
 */

const SHEET_NAME = "Scores";
const META_SHEET = "_meta";
export const ADMISSION_HEADER = "Admission No";
export const NAME_HEADER = "Student Name";

export interface TemplateComponent {
  id: string;
  label: string;
  maxScore: number;
}
export interface TemplateStudent {
  admissionNo: string;
  name: string;
}
export interface BuildTemplateInput {
  classSubjectId: string;
  termId: string;
  schoolId: string;
  classLabel: string;
  subjectName: string;
  components: TemplateComponent[];
  students: TemplateStudent[];
}

/** Column header for a component, e.g. "Exam (max 60)". */
export function componentHeader(c: TemplateComponent): string {
  return `${c.label} (max ${c.maxScore})`;
}

/**
 * Neutralise spreadsheet formula injection (CSV/XLSX). A cell whose text starts
 * with = + - @ (or a leading tab/CR) is treated as a formula by Excel/Sheets, so
 * a crafted student name like `=cmd|...` could execute on open. Prefix such
 * values with an apostrophe to force text. Applied to roster cells we echo into
 * the generated template.
 */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Normalize a header cell so small formatting differences still match. */
function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Build a class-subject-specific .xlsx: roster pre-filled (admission no + name),
 * one empty column per assessment component, plus a hidden `_meta` sheet that
 * binds the file to its class-subject/term so the wrong sheet can't be uploaded.
 */
export function buildScoreTemplate(input: BuildTemplateInput): Buffer {
  const header = [
    ADMISSION_HEADER,
    NAME_HEADER,
    ...input.components.map(componentHeader),
  ];
  const body = input.students.map((s) => [
    safeCell(s.admissionNo),
    safeCell(s.name),
    ...input.components.map(() => ""),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    ...input.components.map(() => ({ wch: 14 })),
  ];

  const meta = XLSX.utils.aoa_to_sheet([
    ["key", "value"],
    ["classSubjectId", input.classSubjectId],
    ["termId", input.termId],
    ["schoolId", input.schoolId],
    ["class", input.classLabel],
    ["subject", input.subjectName],
    ["generatedAt", new Date().toISOString()],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  XLSX.utils.book_append_sheet(wb, meta, META_SHEET);
  // Hide the metadata sheet so it doesn't confuse non-technical staff.
  if (wb.Workbook?.Sheets?.[1]) wb.Workbook.Sheets[1].Hidden = 1;

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export interface ParsedCell {
  componentId: string;
  raw: string | number | null;
}
export interface ParsedRow {
  rowNumber: number; // 1-based spreadsheet row (header is row 1)
  admissionNo: string;
  name: string;
  cells: ParsedCell[];
}
export interface ParsedWorkbook {
  meta: { classSubjectId: string | null; termId: string | null };
  matchedComponentIds: string[]; // known components that had a column
  missingComponentIds: string[]; // known components with no column
  rows: ParsedRow[];
}

/** Thrown for structural problems (not a spreadsheet, no Scores sheet, etc.). */
export class WorkbookParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkbookParseError";
  }
}

function readMeta(wb: XLSX.WorkBook): ParsedWorkbook["meta"] {
  const ws = wb.Sheets[META_SHEET];
  if (!ws) return { classSubjectId: null, termId: null };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  const map = new Map<string, string>();
  for (const r of rows) {
    if (Array.isArray(r) && r[0] != null) map.set(String(r[0]), r[1] == null ? "" : String(r[1]));
  }
  return {
    classSubjectId: map.get("classSubjectId") || null,
    termId: map.get("termId") || null,
  };
}

/**
 * Parse an uploaded workbook into rows, mapping its score columns onto the
 * school's live assessment components by header text (robust to column
 * reordering; unknown columns are ignored). Throws WorkbookParseError when the
 * file isn't a usable score sheet.
 */
export function parseScoreWorkbook(
  buffer: ArrayBuffer,
  knownComponents: TemplateComponent[],
): ParsedWorkbook {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  } catch {
    throw new WorkbookParseError("That file isn't a readable spreadsheet (.xlsx).");
  }

  // Find the Scores sheet (case-insensitive), else fall back to the first sheet.
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === SHEET_NAME.toLowerCase()) ??
    wb.SheetNames.find((n) => n !== META_SHEET) ??
    wb.SheetNames[0];
  const ws = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!ws) throw new WorkbookParseError("The spreadsheet has no sheets to read.");

  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: null,
  });
  if (aoa.length === 0) throw new WorkbookParseError("The sheet is empty.");

  const headerRow = aoa[0] ?? [];

  // Map header text -> componentId (match generated header first, then label).
  const headerToId = new Map<string, string>();
  const labelToId = new Map<string, string>();
  for (const c of knownComponents) {
    headerToId.set(normalize(componentHeader(c)), c.id);
    labelToId.set(normalize(c.label), c.id);
  }

  const colToComponentId = new Map<number, string>();
  let admissionCol = 0;
  let nameCol = 1;
  let foundAdmissionHeader = false;
  headerRow.forEach((cell, idx) => {
    const norm = normalize(cell);
    if (norm === normalize(ADMISSION_HEADER)) {
      admissionCol = idx;
      foundAdmissionHeader = true;
    } else if (norm === normalize(NAME_HEADER)) nameCol = idx;
    const id = headerToId.get(norm) ?? labelToId.get(norm);
    if (id && !colToComponentId.has(idx)) colToComponentId.set(idx, id);
  });

  const matched = new Set(colToComponentId.values());

  // A real score sheet has at least the admission column or a recognizable
  // score column; otherwise the upload isn't our template (or is junk).
  if (!foundAdmissionHeader && matched.size === 0) {
    throw new WorkbookParseError("This doesn't look like a score sheet. Use the downloaded template.");
  }

  const matchedComponentIds = knownComponents.filter((c) => matched.has(c.id)).map((c) => c.id);
  const missingComponentIds = knownComponents.filter((c) => !matched.has(c.id)).map((c) => c.id);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const r = aoa[i] ?? [];
    const admissionNo = r[admissionCol] == null ? "" : String(r[admissionCol]).trim();
    const name = r[nameCol] == null ? "" : String(r[nameCol]).trim();

    const cells: ParsedCell[] = [];
    for (const [col, componentId] of colToComponentId) {
      const v = r[col];
      cells.push({ componentId, raw: typeof v === "number" || typeof v === "string" ? v : null });
    }

    // Skip rows that are entirely blank (no admission no and no values).
    const hasValue = cells.some((c) => c.raw !== null && String(c.raw).trim() !== "");
    if (!admissionNo && !hasValue) continue;

    rows.push({ rowNumber: i + 1, admissionNo, name, cells });
  }

  return { meta: readMeta(wb), matchedComponentIds, missingComponentIds, rows };
}
