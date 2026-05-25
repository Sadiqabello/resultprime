import type { ReactNode } from "react";
import type { Tone, ActivityItem, RankedStudent } from "@/modules/dashboard/service";
import { TONE_BG, TONE_STROKE } from "./tones";

/* ── Ring: an SVG donut for a single 0–100 figure (pass rate, fee clearance) ── */
export function Ring({
  value,
  display,
  caption,
  tone = "good",
  size = 132,
}: {
  value: number;
  display: string;
  caption?: string;
  tone?: Tone;
  size?: number;
}) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={TONE_STROKE[tone]}
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums leading-none">{display}</span>
        {caption ? <span className="mt-1 text-[11px] text-muted-foreground">{caption}</span> : null}
      </div>
    </div>
  );
}

/* ── BarList: labelled horizontal bars (class comparison, distribution) ─────── */
export interface BarItem {
  label: string;
  value: number;
  tone?: Tone;
  display?: string;
  meta?: string;
}
export function BarList({ items, max }: { items: BarItem[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <Empty>Nothing to show yet.</Empty>;
  return (
    <ul className="space-y-2.5">
      {items.map((it, idx) => (
        <li key={`${it.label}-${idx}`} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-foreground/80" title={it.label}>
            {it.label}
            {it.meta ? <span className="ml-1 text-xs text-muted-foreground">{it.meta}</span> : null}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span
              className={`block h-full rounded-full ${TONE_BG[it.tone ?? "good"]}`}
              style={{ width: `${Math.max(2, Math.round((it.value / top) * 100))}%` }}
            />
          </span>
          <span className="w-12 text-right text-sm font-medium tabular-nums">{it.display ?? it.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── SegmentBar: one stacked bar + legend (results pipeline) ────────────────── */
export function SegmentBar({ segments }: { segments: { label: string; count: number; tone: Tone }[] }) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {total === 0 ? null : segments.map((s) => (
          s.count > 0 ? (
            <span
              key={s.label}
              className={TONE_BG[s.tone]}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className={`size-2.5 rounded-full ${TONE_BG[s.tone]}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums sm:ml-1">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── RankedList: numbered students with an average badge (top / at-risk) ────── */
export function RankedList({
  items,
  tone = "good",
  empty,
}: {
  items: RankedStudent[];
  tone?: Tone;
  empty: string;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ol className="space-y-2">
      {items.map((s, i) => (
        <li key={`${s.name}-${i}`} className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{s.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{s.classLabel}</span>
          </span>
          <span className={`text-sm font-semibold tabular-nums ${tone === "fail" ? "text-rose-600" : "text-emerald-600"}`}>
            {s.average}%
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ── ActivityFeed: recent audited actions ──────────────────────────────────── */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <Empty>No recent activity.</Empty>;
  return (
    <ul className="space-y-3">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
          <span className="min-w-0 flex-1">
            <span className="text-foreground/90">{prettyAction(a.action)}</span>
            {a.entity ? <span className="text-muted-foreground"> · {a.entity}</span> : null}
            <span className="block text-xs text-muted-foreground">
              {a.actor} · {timeAgo(a.at)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Humanise an audit action key like "results.computed_class" → "Results computed class". */
function prettyAction(action: string): string {
  const s = action.replace(/[._]/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(then).toLocaleDateString();
}
