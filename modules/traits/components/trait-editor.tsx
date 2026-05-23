"use client";

import { useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { Plus, X } from "lucide-react";
import { saveTraits } from "../actions";
import { TRAIT_CATEGORIES, type TraitCategory } from "../schema";
import type { TraitItem } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TraitEditor({ initial }: { initial: { configured: boolean; traits: TraitItem[] } }) {
  const [rows, setRows] = useState<TraitItem[]>(initial.traits);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  useActionToast(status, "Saved");

  const set = (i: number, p: Partial<TraitItem>) => { setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...p } : x))); setStatus(null); };
  const add = () => { setRows((r) => [...r, { name: "", category: "affective" }]); setStatus(null); };
  const remove = (i: number) => { setRows((r) => r.filter((_, idx) => idx !== i)); setStatus(null); };

  function save() {
    setStatus(null);
    start(async () => {
      const res = await saveTraits({ traits: rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), category: r.category })) });
      setStatus(res.ok ? { ok: true } : { error: res.error });
    });
  }

  return (
    <div className="space-y-3">
      {!initial.configured ? (
        <p className="text-xs text-muted-foreground">Start from these common traits and tailor them. Ratings are entered per student on the Remarks page.</p>
      ) : null}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Punctuality" className="flex-1" />
            <select value={r.category} onChange={(e) => set(i, { category: e.target.value as TraitCategory })} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
              {TRAIT_CATEGORIES.map((c) => <option key={c} value={c}>{c[0]!.toUpperCase() + c.slice(1)}</option>)}
            </select>
            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive" aria-label="Remove trait"><X className="size-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="size-4" /> Add trait</Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save traits"}</Button>
        {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
      </div>
    </div>
  );
}
