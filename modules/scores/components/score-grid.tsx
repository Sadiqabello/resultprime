"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { Lock } from "lucide-react";
import { saveScores } from "../actions";
import type { SheetView } from "../service";
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

const CELL =
  "h-8 w-16 rounded-md border bg-transparent px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60";

export function ScoreGrid({ sheet }: { sheet: SheetView }) {
  const key = (enr: string, comp: string) => `${enr}:${comp}`;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(sheet.scores)) v[k] = val == null ? "" : String(val);
    return v;
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  useActionToast(status, "Scores saved");

  const maxById = useMemo(
    () => new Map(sheet.components.map((c) => [c.id, c.maxScore])),
    [sheet.components],
  );

  const invalid = (compId: string, raw: string) => {
    if (raw === "") return false;
    const n = Number(raw);
    return Number.isNaN(n) || n < 0 || n > (maxById.get(compId) ?? Infinity);
  };
  const anyInvalid = Object.entries(values).some(([k, raw]) => invalid(k.split(":")[1]!, raw));

  const rowTotal = (enr: string) =>
    sheet.components.reduce((sum, c) => sum + (Number(values[key(enr, c.id)]) || 0), 0);

  function set(enr: string, comp: string, raw: string) {
    setValues((v) => ({ ...v, [key(enr, comp)]: raw }));
    setStatus(null);
  }

  function save() {
    setStatus(null);
    const cells: {
      enrollmentId: string;
      assessmentComponentId: string;
      value: number | null;
      isAbsent: boolean;
      isExempt: boolean;
    }[] = [];
    for (const s of sheet.students) {
      for (const c of sheet.components) {
        const k = key(s.enrollmentId, c.id);
        const raw = values[k] ?? "";
        const had = k in sheet.scores;
        if (raw !== "") {
          cells.push({ enrollmentId: s.enrollmentId, assessmentComponentId: c.id, value: Number(raw), isAbsent: false, isExempt: false });
        } else if (had) {
          cells.push({ enrollmentId: s.enrollmentId, assessmentComponentId: c.id, value: null, isAbsent: false, isExempt: false });
        }
      }
    }
    if (cells.length === 0) {
      setStatus({ error: "Nothing to save yet." });
      return;
    }
    startTransition(async () => {
      const res = await saveScores({ classSubjectId: sheet.classSubjectId, termId: sheet.termId, cells });
      setStatus(res.ok ? { ok: true } : { error: res.error });
    });
  }

  return (
    <div className="space-y-4">
      {sheet.locked ? (
        <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="size-4" /> These results are locked for approval — scores are read-only.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">Student</TableHead>
              {sheet.components.map((c) => (
                <TableHead key={c.id} className="text-right">
                  {c.label}
                  <span className="block text-[10px] font-normal text-muted-foreground">/ {c.maxScore}</span>
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.students.map((s) => (
              <TableRow key={s.enrollmentId}>
                <TableCell>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</span>
                </TableCell>
                {sheet.components.map((c) => {
                  const k = key(s.enrollmentId, c.id);
                  const raw = values[k] ?? "";
                  const bad = invalid(c.id, raw);
                  return (
                    <TableCell key={c.id} className="text-right">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={c.maxScore}
                        value={raw}
                        disabled={sheet.locked}
                        onChange={(e) => set(s.enrollmentId, c.id, e.target.value)}
                        className={cn(CELL, bad ? "border-destructive ring-1 ring-destructive" : "border-input")}
                        aria-label={`${s.name} ${c.label}`}
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium tabular-nums">{rowTotal(s.enrollmentId)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!sheet.locked ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={pending || anyInvalid}>
            {pending ? "Saving…" : "Save scores"}
          </Button>
          {anyInvalid ? (
            <span className="text-sm text-destructive">Some scores exceed their maximum.</span>
          ) : null}
          {status && "error" in status ? (
            <span className="text-sm text-destructive">{status.error}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
