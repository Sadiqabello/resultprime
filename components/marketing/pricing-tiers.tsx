import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const VERIFY = "#bc6c25";

export interface PricingTier {
  name: string;
  /** Pre-formatted headline price, e.g. "Free", "₦100". */
  price: string;
  /** Unit shown next to the price, e.g. "/ student / term", "14 days". */
  unit: string;
  /** Small line under the price (optional). */
  note?: string;
  desc: string;
  features: string[];
  cta: string;
  featured: boolean;
}

/**
 * Usage-based pricing: one rate for the whole school, charged per active student
 * by the term or the session. The recommended tier is emphasised with a stamp.
 */
export function PricingTiers({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="mt-8 grid border-t border-[#283618]/15 md:grid-cols-3">
      {tiers.map((t) => (
        <div
          key={t.name}
          className={cn(
            "relative border-b border-[#283618]/15 p-8 md:border-b-0 md:border-l md:border-[#283618]/15 md:first:border-l-0",
            t.featured && "bg-white md:-my-px md:ring-2 md:ring-[#283618]/15",
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
            <span className="font-display text-4xl font-medium tabular-nums text-[#283618]">{t.price}</span>
            <span className="font-sans text-sm text-[#283618]/45">{t.unit}</span>
          </p>
          <p className="mt-1 h-4 font-sans text-[12px] text-[#283618]/40">{t.note ?? ""}</p>
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
      ))}
    </div>
  );
}
