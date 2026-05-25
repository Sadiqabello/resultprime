import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/modules/dashboard/service";
import { Card, CardContent } from "@/components/ui/card";
import { TONE_BG, TONE_TEXT } from "./tones";

/**
 * Headline KPI tile: a big figure with an icon, an optional sub-line, and an
 * optional thin progress bar. Tonally coloured (pass rate green, at-risk red…).
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  progress,
  tone = "good",
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  progress?: number | null;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums leading-none">{value}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted ${TONE_TEXT[tone]}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      {typeof progress === "number" ? (
        <span className="mt-4 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className={`block h-full rounded-full ${TONE_BG[tone]}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </span>
      ) : null}
      {sub ? <p className="mt-2 truncate text-xs text-muted-foreground">{sub}</p> : null}
    </CardContent>
  );

  return href ? (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/30">{body}</Card>
    </Link>
  ) : (
    <Card className="h-full">{body}</Card>
  );
}
