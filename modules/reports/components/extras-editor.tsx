"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveClassExtras } from "../actions";
import type { ClassExtrasView } from "../service";
import { Button } from "@/components/ui/button";
import { ordinal } from "@/lib/utils";

type Row = ClassExtrasView["rows"][number];

export function ExtrasEditor({ classId, view }: { classId: string; view: ClassExtrasView }) {
  const [rows, setRows] = useState<Row[]>(view.rows);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: true; n: number } | { error: string } | null>(null);

  function patch(i: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
    setStatus(null);
  }
  const num = (s: string): number | null => (s.trim() === "" ? null : Math.max(0, Math.floor(Number(s) || 0)));

  function save() {
    setStatus(null);
    start(async () => {
      const res = await saveClassExtras({
        classId,
        rows: rows.map((r) => ({
          enrollmentId: r.enrollmentId,
          classTeacherRemark: r.classTeacherRemark,
          principalRemark: r.principalRemark,
          attendancePresent: r.attendancePresent,
          attendanceTotal: r.attendanceTotal,
        })),
      });
      setStatus(res.ok ? { ok: true, n: res.saved } : { error: res.error });
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No computed results for this class/term yet. Compute results first — remarks attach to each
        student&apos;s term result.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.enrollmentId} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {r.average == null ? "—" : `${r.average}%`}
                {r.position ? ` · ${ordinal(r.position)}` : ""}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Class teacher&apos;s remark</span>
                <textarea
                  rows={2}
                  aria-label={`${r.name} class teacher remark`}
                  value={r.classTeacherRemark}
                  onChange={(e) => patch(i, { classTeacherRemark: e.target.value })}
                  className="block w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Principal&apos;s remark</span>
                <textarea
                  rows={2}
                  aria-label={`${r.name} principal remark`}
                  value={r.principalRemark}
                  onChange={(e) => patch(i, { principalRemark: e.target.value })}
                  className="block w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground">Attendance</span>
              <input
                type="number"
                min={0}
                aria-label={`${r.name} days present`}
                value={r.attendancePresent ?? ""}
                onChange={(e) => patch(i, { attendancePresent: num(e.target.value) })}
                className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-right text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="present"
              />
              <span className="text-muted-foreground">of</span>
              <input
                type="number"
                min={0}
                aria-label={`${r.name} total days`}
                value={r.attendanceTotal ?? ""}
                onChange={(e) => patch(i, { attendanceTotal: num(e.target.value) })}
                className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-right text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="total"
              />
              <span className="text-muted-foreground">days</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save remarks & attendance"}
        </Button>
        {status && "ok" in status ? (
          <span className="flex items-center gap-1.5 text-sm text-brand-600">
            <Check className="size-4" /> Saved {status.n} student{status.n === 1 ? "" : "s"}
          </span>
        ) : null}
        {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
      </div>
    </div>
  );
}
