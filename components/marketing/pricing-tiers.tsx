"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const VERIFY = "#bc6c25";
const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export interface PricingTier {
  name: string;
  /** Annual price in NGN, or null for the free trial. */
  annual: number | null;
  freeLabel?: string;
  unitYear: string;
  desc: string;
  features: string[];
  cta: string;
  featured: boolean;
}

/**
 * Pricing tiers with a Yearly / Per-term billing-cycle toggle. Per-term is the
 * annual price ÷ 3 (still billed yearly — shown for budgeting), so nothing is
 * fabricated. The recommended plan is emphasised with a stamp + tint.
 */
export function PricingTiers({ tiers }: { tiers: PricingTier[] }) {
  const [cycle, setCycle] = useState<"year" | "term">("year");

  return (
    <>
      <div className="mt-8 flex justify-center" data-reveal>
        <div className="inline-flex rounded-full border border-[#283618]/15 bg-[#fefae0] p-1 font-sans text-[13px] font-semibold">
          {(["year", "term"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              aria-pressed={cycle === c}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                cycle === c ? "bg-[#283618] text-white" : "text-[#283618]/60 hover:text-[#283618]",
              )}
            >
              {c === "year" ? "Yearly" : "Per term"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid border-t border-[#283618]/12 md:grid-cols-3">
        {tiers.map((t) => {
          const isPaid = t.annual !== null;
          const price = !isPaid
            ? t.freeLabel ?? "Free"
            : cycle === "year"
              ? ngn(t.annual!)
              : ngn(Math.round(t.annual! / 3));
          const unit = !isPaid ? t.unitYear : cycle === "year" ? "/ year" : "≈ / term";
          return (
            <div
              key={t.name}
              className={cn(
                "relative border-b border-[#283618]/12 p-8 md:border-b-0 md:border-l md:border-[#283618]/12 md:first:border-l-0",
                t.featured && "bg-[#fefae0] md:-my-px md:ring-2 md:ring-[#283618]/15",
              )}
              data-reveal
            >
              {t.featured ? (
                <span
                  className="absolute right-6 top-6 inline-flex -rotate-[7deg] select-none flex-col items-center rounded-[3px] border-[2.5px] px-2.5 py-1 text-center leading-none"
                  style={{ borderColor: VERIFY, color: VERIFY, boxShadow: `inset 0 0 0 1px ${VERIFY}` }}
                  aria-hidden
                >
                  <span className="font-sans text-[7px] font-bold tracking-[0.28em]">RESULT PRIME</span>
                  <span className="mt-0.5 font-display text-[11px] font-bold uppercase tracking-[0.16em]">Most popular</span>
                </span>
              ) : null}
              <h3 className="font-display text-lg font-semibold text-[#283618]">{t.name}</h3>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-medium tabular-nums text-[#283618]">{price}</span>
                <span className="font-sans text-sm text-[#283618]/45">{unit}</span>
              </p>
              <p className="mt-1 h-4 font-sans text-[12px] text-[#283618]/40">
                {isPaid && cycle === "term" ? "billed yearly" : ""}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5b6048]">{t.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#283618]">
                    <span aria-hidden className="mt-0.5 font-display font-bold leading-none" style={{ color: VERIFY }}>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={t.featured ? "default" : "outline"}
                className={cn(
                  "mt-8 w-full rounded-sm",
                  t.featured ? "bg-[#283618] hover:bg-[#283618]/90" : "border-[#283618]/30 text-[#283618]",
                )}
              >
                <Link href="/signup">{t.cta}</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
