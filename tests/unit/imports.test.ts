import { describe, it, expect } from "vitest";
import { analyze } from "@/modules/imports/analyze";
import { buildScoreTemplate, parseScoreWorkbook } from "@/modules/imports/xlsx";
import type { SheetView } from "@/modules/scores/service";
import type { ParsedWorkbook } from "@/modules/imports/xlsx";

const components = [
  { id: "c-ca", label: "CA", maxScore: 40, isExam: false },
  { id: "c-exam", label: "Exam", maxScore: 60, isExam: true },
];

const sheet: SheetView = {
  classSubjectId: "cs-1",
  termId: "term-1",
  classLabel: "JSS1 A",
  subjectName: "Mathematics",
  termName: "First",
  locked: false,
  components,
  students: [
    { enrollmentId: "e-ada", name: "Ada", admissionNo: "001" },
    { enrollmentId: "e-bola", name: "Bola", admissionNo: "002" },
  ],
  scores: {
    // Bola already has a CA of 30 on file (to exercise update/unchanged).
    "e-bola:c-ca": 30,
  },
};

/** Build a parsed-workbook fixture the way xlsx.ts would hand it to analyze. */
function wb(rows: ParsedWorkbook["rows"], meta?: Partial<ParsedWorkbook["meta"]>): ParsedWorkbook {
  return {
    meta: { classSubjectId: "cs-1", termId: "term-1", ...meta },
    matchedComponentIds: ["c-ca", "c-exam"],
    missingComponentIds: [],
    rows,
  };
}

/** analyze() against the standard target class-subject. */
const run = (s: SheetView, parsed: ParsedWorkbook) => analyze(s, parsed, "cs-1");

describe("score import — template roundtrip", () => {
  it("writes the roster + component columns and parses back", () => {
    const buf = buildScoreTemplate({
      classSubjectId: "cs-1",
      termId: "term-1",
      schoolId: "school-1",
      classLabel: "JSS1 A",
      subjectName: "Mathematics",
      components,
      students: [
        { admissionNo: "001", name: "Ada" },
        { admissionNo: "002", name: "Bola" },
      ],
    });

    const parsed = parseScoreWorkbook(new Uint8Array(buf).buffer, components);
    expect(parsed.meta.classSubjectId).toBe("cs-1");
    expect(parsed.meta.termId).toBe("term-1");
    expect(parsed.matchedComponentIds.sort()).toEqual(["c-ca", "c-exam"]);
    expect(parsed.missingComponentIds).toEqual([]);
    expect(parsed.rows.map((r) => r.admissionNo)).toEqual(["001", "002"]);
  });

  it("reports a component column that's absent from the file", () => {
    const buf = buildScoreTemplate({
      classSubjectId: "cs-1",
      termId: "term-1",
      schoolId: "school-1",
      classLabel: "JSS1 A",
      subjectName: "Mathematics",
      components: [components[0]!], // only CA in the file
      students: [{ admissionNo: "001", name: "Ada" }],
    });
    const parsed = parseScoreWorkbook(new Uint8Array(buf).buffer, components);
    expect(parsed.matchedComponentIds).toEqual(["c-ca"]);
    expect(parsed.missingComponentIds).toEqual(["c-exam"]);
  });

  it("rejects a non-spreadsheet", () => {
    expect(() => parseScoreWorkbook(new TextEncoder().encode("not a workbook").buffer, components)).toThrow();
  });
});

describe("score import — diff & validation", () => {
  it("classifies insert / update / unchanged / blank-skip", () => {
    const preview = run(
      sheet,
      wb([
        // Ada: both new → two inserts
        { rowNumber: 2, admissionNo: "001", name: "Ada", cells: [
          { componentId: "c-ca", raw: 35 },
          { componentId: "c-exam", raw: 50 },
        ] },
        // Bola: CA 30→30 unchanged, Exam blank → skip (no change at all → warning row)
        { rowNumber: 3, admissionNo: "002", name: "Bola", cells: [
          { componentId: "c-ca", raw: 30 },
          { componentId: "c-exam", raw: "" },
        ] },
      ]),
    );
    expect(preview.summary.inserts).toBe(2);
    expect(preview.summary.updates).toBe(0);
    expect(preview.summary.unchanged).toBe(1);
    expect(preview.rows[0]!.status).toBe("valid");
    expect(preview.rows[1]!.status).toBe("warning");
    expect(preview.canCommit).toBe(true);
  });

  it("counts an update when an existing score changes", () => {
    const preview = run(
      sheet,
      wb([{ rowNumber: 2, admissionNo: "002", name: "Bola", cells: [{ componentId: "c-ca", raw: 38 }] }]),
    );
    expect(preview.summary.updates).toBe(1);
    expect(preview.rows[0]!.cells[0]!.oldValue).toBe(30);
    expect(preview.rows[0]!.cells[0]!.newValue).toBe(38);
  });

  it("errors on a score over the component max", () => {
    const preview = run(
      sheet,
      wb([{ rowNumber: 2, admissionNo: "001", name: "Ada", cells: [{ componentId: "c-exam", raw: 80 }] }]),
    );
    expect(preview.summary.errorRows).toBe(1);
    expect(preview.rows[0]!.cells[0]!.message).toContain("60");
    expect(preview.canCommit).toBe(false);
  });

  it("errors on an unknown admission number", () => {
    const preview = run(
      sheet,
      wb([{ rowNumber: 2, admissionNo: "999", name: "Ghost", cells: [{ componentId: "c-ca", raw: 20 }] }]),
    );
    expect(preview.rows[0]!.status).toBe("error");
    expect(preview.rows[0]!.message).toContain("admission");
    expect(preview.canCommit).toBe(false);
  });

  it("flags a duplicate row for the same student", () => {
    const preview = run(
      sheet,
      wb([
        { rowNumber: 2, admissionNo: "001", name: "Ada", cells: [{ componentId: "c-ca", raw: 20 }] },
        { rowNumber: 3, admissionNo: "001", name: "Ada", cells: [{ componentId: "c-ca", raw: 25 }] },
      ]),
    );
    expect(preview.rows[1]!.status).toBe("error");
    expect(preview.rows[1]!.message).toContain("Duplicate");
  });

  it("blocks commit when the sheet was generated for a different class-subject", () => {
    const preview = run(
      sheet,
      wb(
        [{ rowNumber: 2, admissionNo: "001", name: "Ada", cells: [{ componentId: "c-ca", raw: 20 }] }],
        { classSubjectId: "cs-OTHER" },
      ),
    );
    expect(preview.metaMismatch).toBe(true);
    expect(preview.canCommit).toBe(false);
  });

  it("blocks commit when results are locked", () => {
    const preview = run(
      { ...sheet, locked: true },
      wb([{ rowNumber: 2, admissionNo: "001", name: "Ada", cells: [{ componentId: "c-ca", raw: 20 }] }]),
    );
    expect(preview.canCommit).toBe(false);
  });
});
