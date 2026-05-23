"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { validateGradeBands } from "@/lib/result-engine";
import { saveGrading } from "../actions";
import type { GradingConfigView } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SELECT =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type BandRow = { grade: string; min: string; max: string; remark: string; gradePoint: string };
type CompRow = { key: string; label: string; maxScore: string; isExam: boolean };

export function GradingEditor({ initial }: { initial: GradingConfigView }) {
  const [name, setName] = useState(initial.name);
  const [roundingDp, setRoundingDp] = useState(String(initial.roundingDp));
  const [tieStrategy, setTieStrategy] = useState(initial.tieStrategy);
  const [excludeAbsent, setExcludeAbsent] = useState(initial.excludeAbsentFromRank);
  const [passMark, setPassMark] = useState(String(initial.passMark));
  const [bands, setBands] = useState<BandRow[]>(
    initial.bands.map((b) => ({
      grade: b.grade,
      min: String(b.min),
      max: String(b.max),
      remark: b.remark,
      gradePoint: b.gradePoint == null ? "" : String(b.gradePoint),
    })),
  );
  const [components, setComponents] = useState<CompRow[]>(
    initial.components.map((c) => ({
      key: c.key,
      label: c.label,
      maxScore: String(c.maxScore),
      isExam: c.isExam,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  useActionToast(status, "Grading saved");

  const bandCheck = useMemo(
    () =>
      validateGradeBands(
        bands.map((b) => ({
          min: Number(b.min || 0),
          max: Number(b.max || 0),
          grade: b.grade,
          remark: b.remark,
        })),
      ),
    [bands],
  );
  const total = components.reduce((s, c) => s + (Number(c.maxScore) || 0), 0);
  const hasExam = components.some((c) => c.isExam);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const res = await saveGrading({
        name,
        roundingDp: Number(roundingDp),
        tieStrategy,
        excludeAbsentFromRank: excludeAbsent,
        passMark: Number(passMark),
        bands: bands.map((b) => ({
          grade: b.grade,
          min: Number(b.min),
          max: Number(b.max),
          remark: b.remark,
          gradePoint: b.gradePoint === "" ? null : Number(b.gradePoint),
        })),
        components: components.map((c) => ({
          key: c.key,
          label: c.label,
          maxScore: Number(c.maxScore),
          isExam: c.isExam,
        })),
      });
      setStatus(res.ok ? { ok: true } : { error: res.error });
    });
  }

  const setBand = (i: number, patch: Partial<BandRow>) =>
    setBands((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setComp = (i: number, patch: Partial<CompRow>) =>
    setComponents((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-6">
      {/* Assessment components */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assessment components</CardTitle>
          <CardDescription>
            How a subject&apos;s 100 is split — continuous assessment and exam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[1fr_5rem_4.5rem_4rem_2rem] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Label</span>
            <span>Key</span>
            <span>Max</span>
            <span>Exam</span>
            <span />
          </div>
          {components.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_4.5rem_4rem_2rem] items-center gap-2">
              <Input value={c.label} onChange={(e) => setComp(i, { label: e.target.value })} placeholder="1st C.A." />
              <Input value={c.key} onChange={(e) => setComp(i, { key: e.target.value })} placeholder="ca1" />
              <Input type="number" min={0} value={c.maxScore} onChange={(e) => setComp(i, { maxScore: e.target.value })} />
              <label className="flex h-9 items-center justify-center rounded-md border border-input">
                <input
                  type="checkbox"
                  checked={c.isExam}
                  onChange={(e) => setComp(i, { isExam: e.target.checked })}
                  className="size-4 accent-brand-600"
                />
              </label>
              <button
                type="button"
                onClick={() => setComponents((r) => r.filter((_, j) => j !== i))}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove component"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setComponents((r) => [...r, { key: "", label: "", maxScore: "", isExam: false }])}
            >
              <Plus className="size-4" /> Add component
            </Button>
            <span className={total === 100 ? "text-sm text-muted-foreground" : "text-sm font-medium text-amber-600"}>
              Total obtainable: <span className="tabular-nums">{total}</span>
            </span>
          </div>
          {!hasExam ? (
            <p className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle className="size-4" /> Mark one component as the exam.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Grade scale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Grade scale</CardTitle>
          <CardDescription>Score ranges must cover 0–100 with no gaps or overlaps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[3.5rem_4rem_4rem_1fr_4rem_2rem] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Grade</span>
            <span>Min</span>
            <span>Max</span>
            <span>Remark</span>
            <span>Points</span>
            <span />
          </div>
          {bands.map((b, i) => (
            <div key={i} className="grid grid-cols-[3.5rem_4rem_4rem_1fr_4rem_2rem] items-center gap-2">
              <Input value={b.grade} onChange={(e) => setBand(i, { grade: e.target.value })} placeholder="A1" />
              <Input type="number" min={0} max={100} value={b.min} onChange={(e) => setBand(i, { min: e.target.value })} />
              <Input type="number" min={0} max={100} value={b.max} onChange={(e) => setBand(i, { max: e.target.value })} />
              <Input value={b.remark} onChange={(e) => setBand(i, { remark: e.target.value })} placeholder="Excellent" />
              <Input type="number" value={b.gradePoint} onChange={(e) => setBand(i, { gradePoint: e.target.value })} placeholder="—" />
              <button
                type="button"
                onClick={() => setBands((r) => r.filter((_, j) => j !== i))}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove band"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBands((r) => [...r, { grade: "", min: "", max: "", remark: "", gradePoint: "" }])}
            >
              <Plus className="size-4" /> Add grade
            </Button>
            {bandCheck.valid ? (
              <span className="flex items-center gap-1.5 text-sm text-brand-600">
                <Check className="size-4" /> Bands cover 0–100
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="size-4" /> {bandCheck.reason}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Computation rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Computation rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="g-name">Name</Label>
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-pass">Pass mark</Label>
            <Input id="g-pass" type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-round">Round average to</Label>
            <select id="g-round" className={SELECT} value={roundingDp} onChange={(e) => setRoundingDp(e.target.value)}>
              <option value="0">Whole number</option>
              <option value="1">1 decimal</option>
              <option value="2">2 decimals</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-tie">Tie handling</Label>
            <select
              id="g-tie"
              className={SELECT}
              value={tieStrategy}
              onChange={(e) => setTieStrategy(e.target.value as "standard" | "dense")}
            >
              <option value="standard">Standard (1, 2, 2, 4)</option>
              <option value="dense">Dense (1, 2, 2, 3)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={excludeAbsent}
              onChange={(e) => setExcludeAbsent(e.target.checked)}
              className="size-4 accent-brand-600"
            />
            Exclude absent students from positions
          </label>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending || !bandCheck.valid || !hasExam}>
          {pending ? "Saving…" : "Save grading system"}
        </Button>
        {status && "error" in status ? (
          <span className="text-sm text-destructive">{status.error}</span>
        ) : null}
      </div>
    </div>
  );
}
