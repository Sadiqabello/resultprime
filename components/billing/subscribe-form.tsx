"use client";

import { useState } from "react";
import { startCheckout } from "@/modules/billing/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingPeriod } from "@/config/plans";

const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const PERIODS: { key: BillingPeriod; label: string; sub: string }[] = [
  { key: "term", label: "Per term", sub: "billed each term" },
  { key: "session", label: "Per session", sub: "covers the full session (3 terms)" },
];

/**
 * Buy student slots: choose a billing period + how many students, see the live
 * total, and check out. Used by the subscription page and the locked screen.
 * The chosen quantity becomes the school's student quota once paid; the server
 * re-validates (rate, bounds, and "≥ current roster"), so this is UX only.
 */
export function SubscribeForm({
  pricePerStudent,
  minStudents = 1,
  defaultPeriod = "session",
  disabled = false,
  cta = "Subscribe",
}: {
  pricePerStudent: Record<BillingPeriod, number>;
  /** Can't buy fewer slots than the current roster. */
  minStudents?: number;
  defaultPeriod?: BillingPeriod;
  disabled?: boolean;
  cta?: string;
}) {
  const floor = Math.max(1, minStudents);
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);
  const [qty, setQty] = useState<number>(floor);

  const rate = pricePerStudent[period];
  const valid = Number.isInteger(qty) && qty >= floor;
  const total = valid ? rate * qty : 0;

  return (
    <form action={startCheckout} className="space-y-4">
      <input type="hidden" name="period" value={period} />

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Billing period">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              period === p.key ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-600/30" : "border-border hover:border-brand-300",
            )}
          >
            <span className="block text-sm font-semibold text-brand-950">{p.label}</span>
            <span className="block text-xs text-muted-foreground">{ngn(pricePerStudent[p.key])} / student · {p.sub}</span>
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-brand-900">
        Number of students
        <input
          type="number"
          name="quantity"
          min={floor}
          step={1}
          value={Number.isFinite(qty) ? qty : ""}
          onChange={(e) => setQty(Math.trunc(Number(e.target.value)))}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        {minStudents > 1 ? (
          <span className="mt-1 block text-xs text-muted-foreground">You currently have {minStudents} students — buy at least that many.</span>
        ) : null}
      </label>

      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-display text-2xl font-semibold tabular-nums text-brand-950">
          {ngn(total)} <span className="text-sm font-normal text-muted-foreground">/ {period}</span>
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={disabled || !valid}>
        {cta}
      </Button>
    </form>
  );
}
