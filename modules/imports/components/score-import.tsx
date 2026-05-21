"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  Upload,
  XCircle,
} from "lucide-react";
import { previewScoreImport, commitScoreImport } from "../actions";
import type { ScoreImportPreview, ScoreImportResult } from "../service";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  classSubjectId: string;
}

const fmt = (n: number | null) => (n == null ? "—" : String(n));

export function ScoreImport({ classSubjectId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ScoreImportPreview | null>(null);
  const [result, setResult] = useState<ScoreImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
  }

  function onPick(f: File | null) {
    setFile(f);
    reset();
    if (!f) return;
    const fd = new FormData();
    fd.set("classSubjectId", classSubjectId);
    fd.set("file", f);
    startTransition(async () => {
      const res = await previewScoreImport(fd);
      if (res.ok) setPreview(res.preview);
      else setError(res.error);
    });
  }

  function onConfirm() {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("classSubjectId", classSubjectId);
    fd.set("file", file);
    startTransition(async () => {
      const res = await commitScoreImport(fd);
      if (res.ok) {
        setResult(res.result);
        setPreview(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setError(res.error);
      }
    });
  }

  function downloadErrors() {
    if (!preview) return;
    const lines = [["Row", "Admission No", "Student", "Problem"]];
    for (const r of preview.rows) {
      if (r.status !== "error") continue;
      const cellErrors = r.cells
        .filter((c) => c.status === "error")
        .map((c) => `${c.label}: ${c.message ?? "invalid"}`)
        .join("; ");
      lines.push([
        String(r.rowNumber),
        r.admissionNo || "(blank)",
        r.name || "",
        [r.message, cellErrors].filter(Boolean).join("; "),
      ]);
    }
    const csv = lines.map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — template */}
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <Download className="size-4" />
            </span>
            <div>
              <p className="font-medium">1. Download the template</p>
              <p className="text-sm text-muted-foreground">
                A spreadsheet with this class&apos;s roster and a column per assessment. Fill it
                offline — don&apos;t change the <span className="font-medium">Admission No</span> column.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <a href={`/api/imports/scores/template?classSubjectId=${classSubjectId}`}>
              <Download className="size-4" /> Template
            </a>
          </Button>
        </div>
      </div>

      {/* Step 2 — upload */}
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Upload className="size-4" />
          </span>
          <div className="flex-1">
            <p className="font-medium">2. Upload the filled sheet</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll check every row and show you exactly what will change before anything is saved.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={pending}
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                className="block text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
              />
              {file ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="size-4" /> {file.name}
                </span>
              ) : null}
              {pending && !result ? <span className="text-sm text-muted-foreground">Checking…</span> : null}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4" /> {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-5">
          <div className="flex items-center gap-2 text-brand-800">
            <CheckCircle2 className="size-5" />
            <span className="font-medium">Import complete</span>
          </div>
          <p className="mt-2 text-sm text-brand-900">
            Saved {result.committed} score{result.committed === 1 ? "" : "s"} — {result.inserts} new,{" "}
            {result.updates} updated.
          </p>
          <div className="mt-4 flex gap-3">
            <Button asChild size="sm">
              <Link href={`/scores/${classSubjectId}`}>
                Open score sheet <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {preview ? <PreviewPanel preview={preview} onConfirm={onConfirm} onDownloadErrors={downloadErrors} pending={pending} /> : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border px-3 py-2 text-center">
      <div className={cn("text-lg font-semibold tabular-nums", tone)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function rowBadge(status: "valid" | "warning" | "error") {
  if (status === "error")
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><XCircle className="size-3.5" /> Error</span>;
  if (status === "warning")
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="size-3.5" /> No change</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700"><CheckCircle2 className="size-3.5" /> Ready</span>;
}

function PreviewPanel({
  preview,
  onConfirm,
  onDownloadErrors,
  pending,
}: {
  preview: ScoreImportPreview;
  onConfirm: () => void;
  onDownloadErrors: () => void;
  pending: boolean;
}) {
  const s = preview.summary;
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">3. Review &amp; confirm</p>
        <p className="text-sm text-muted-foreground">
          {preview.classLabel} · {preview.subjectName} · {preview.termName} Term
        </p>
      </div>

      {/* Blocking conditions */}
      {preview.locked ? (
        <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="size-4" /> These results are locked for approval — import is disabled until they&apos;re returned or unlocked.
        </p>
      ) : null}
      {preview.metaMismatch ? (
        <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4" /> This sheet was generated for a different class-subject. Download a fresh template above.
        </p>
      ) : null}
      {preview.missingComponents.length > 0 ? (
        <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4" /> No column found for: {preview.missingComponents.join(", ")}. Those assessments won&apos;t be imported.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Stat label="Rows" value={s.totalRows} tone="text-foreground" />
        <Stat label="Ready" value={s.validRows} tone="text-brand-700" />
        <Stat label="New" value={s.inserts} tone="text-brand-700" />
        <Stat label="Updated" value={s.updates} tone="text-amber-700" />
        <Stat label="Unchanged" value={s.unchanged} tone="text-muted-foreground" />
        <Stat label="Errors" value={s.errorRows} tone={s.errorRows ? "text-destructive" : "text-muted-foreground"} />
      </div>

      <div className="max-h-[28rem] overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Student</TableHead>
              {preview.components.map((c) => (
                <TableHead key={c.id} className="text-right">
                  {c.label}
                  <span className="block text-[10px] font-normal text-muted-foreground">/ {c.maxScore}</span>
                </TableHead>
              ))}
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.rows.map((r) => (
              <TableRow key={r.rowNumber} className={cn(r.status === "error" && "bg-destructive/5")}>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{r.rowNumber}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.name || "—"}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
                  {r.message ? <span className="block text-xs text-destructive">{r.message}</span> : null}
                </TableCell>
                {preview.components.map((c) => {
                  const cell = r.cells.find((x) => x.componentId === c.id);
                  if (!cell || cell.status === "skip")
                    return <TableCell key={c.id} className="text-right text-muted-foreground">—</TableCell>;
                  if (cell.status === "error")
                    return (
                      <TableCell key={c.id} className="text-right text-destructive" title={cell.message}>
                        {fmt(cell.newValue)}!
                      </TableCell>
                    );
                  return (
                    <TableCell key={c.id} className="text-right tabular-nums">
                      {cell.status === "update" ? (
                        <span>
                          <span className="text-muted-foreground line-through">{fmt(cell.oldValue)}</span>{" "}
                          <span className="font-medium text-amber-700">{fmt(cell.newValue)}</span>
                        </span>
                      ) : cell.status === "insert" ? (
                        <span className="font-medium text-brand-700">{fmt(cell.newValue)}</span>
                      ) : (
                        <span className="text-muted-foreground">{fmt(cell.newValue)}</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right">{rowBadge(r.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onConfirm} disabled={!preview.canCommit || pending}>
          {pending ? "Importing…" : `Import ${s.inserts + s.updates} score${s.inserts + s.updates === 1 ? "" : "s"}`}
        </Button>
        {s.errorRows > 0 ? (
          <>
            <span className="text-sm text-destructive">Fix {s.errorRows} row(s) with errors, then re-upload.</span>
            <Button variant="outline" size="sm" onClick={onDownloadErrors}>
              <Download className="size-4" /> Download errors
            </Button>
          </>
        ) : !preview.canCommit && !preview.locked && !preview.metaMismatch ? (
          <span className="text-sm text-muted-foreground">Nothing to import — every value matches what&apos;s already saved.</span>
        ) : null}
      </div>
    </div>
  );
}
