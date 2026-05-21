"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Check, GraduationCap, RotateCcw } from "lucide-react";
import { promoteClass } from "../actions";
import type { PromotionPlan, PromotionResult } from "../service";
import { Button } from "@/components/ui/button";

export function PromotePanel({ classId, plan }: { classId: string; plan: PromotionPlan }) {
  const [target, setTarget] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PromotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { summary } = plan;
  const actionable = summary.promote + summary.repeat + summary.graduate;

  function run() {
    setError(null);
    start(async () => {
      const res = await promoteClass(classId, target);
      if (res.ok) {
        setResult(res.result);
        setConfirming(false);
      } else {
        setError(res.error);
      }
    });
  }

  if (!plan.hasCumulative) return null;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="size-5 text-brand-600" />
        <h3 className="font-medium">Promote {plan.classLabel}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Move students into the next session based on the annual decisions below. Re-running is safe —
        it updates rather than duplicates enrolments.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-brand-800">
          <ArrowUpRight className="size-3.5" /> {summary.promote} promote
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-amber-800">
          <RotateCcw className="size-3.5" /> {summary.repeat} repeat
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-neutral-700">
          <GraduationCap className="size-3.5" /> {summary.graduate} graduate
        </span>
        {summary.pending > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-muted-foreground">
            {summary.pending} pending (skipped)
          </span>
        ) : null}
      </div>

      {result ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
          <Check className="size-4" /> Done — {result.promoted} promoted, {result.repeated} repeated, {result.graduated} graduated
          {result.skipped ? `, ${result.skipped} skipped` : ""}.
        </p>
      ) : plan.targetOptions.length === 0 ? (
        <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No next session yet. Create the next session and its first term in Settings, then come back to promote.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={target}
            onChange={(e) => { setTarget(e.target.value); setConfirming(false); setError(null); }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Promote into…</option>
            {plan.targetOptions.map((o) => (
              <option key={o.termId} value={o.termId}>{o.label}</option>
            ))}
          </select>

          {!confirming ? (
            <Button disabled={!target || actionable === 0} onClick={() => setConfirming(true)}>
              Promote {actionable} student{actionable === 1 ? "" : "s"}
            </Button>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Create enrolments for {actionable} student(s)?</span>
              <Button onClick={run} disabled={pending}>{pending ? "Promoting…" : "Confirm"}</Button>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>Cancel</Button>
            </>
          )}
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
        </div>
      )}
    </div>
  );
}
