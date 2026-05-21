"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveClassFees } from "../actions";
import { FEE_STATUSES, type FeeStatus } from "../schema";
import type { ClassFeesView } from "../service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = ClassFeesView["rows"][number];

const DOT: Record<FeeStatus, string> = {
  cleared: "bg-brand-500",
  owing: "bg-destructive",
  partial: "bg-amber-500",
};

export function FeesEditor({ classId, view }: { classId: string; view: ClassFeesView }) {
  const [rows, setRows] = useState<Row[]>(view.rows);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: true; n: number } | { error: string } | null>(null);

  function patch(i: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
    setStatus(null);
  }

  function save() {
    setStatus(null);
    start(async () => {
      const res = await saveClassFees({
        classId,
        rows: rows.map((r) => ({ enrollmentId: r.enrollmentId, status: r.status, note: r.note })),
      });
      setStatus(res.ok ? { ok: true, n: res.saved } : { error: res.error });
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No students enrolled in this class for the term.
      </p>
    );
  }

  const cleared = rows.filter((r) => r.status === "cleared").length;

  return (
    <div className="space-y-4">
      {!view.gatingEnabled ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Fee gating is <strong>off</strong> — statuses are recorded but results aren&apos;t withheld. Turn it on in
          Settings → Branding to block owing students&apos; results.
        </p>
      ) : (
        <p className="rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
          Fee gating is <strong>on</strong> — only students marked <strong>cleared</strong> can view their published
          results. {cleared}/{rows.length} cleared.
        </p>
      )}

      <div className="divide-y rounded-lg border">
        {rows.map((r, i) => (
          <div key={r.enrollmentId} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className={cn("size-2 shrink-0 rounded-full", DOT[r.status])} />
            <span className="min-w-40 flex-1">
              <span className="font-medium">{r.name}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
            </span>
            <select
              value={r.status}
              onChange={(e) => patch(i, { status: e.target.value as FeeStatus })}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`${r.name} fee status`}
            >
              {FEE_STATUSES.map((s) => (
                <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <input
              value={r.note}
              onChange={(e) => patch(i, { note: e.target.value })}
              placeholder="note (optional)"
              aria-label={`${r.name} fee note`}
              className="h-8 w-48 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save fee status"}</Button>
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
