import type { Tone } from "@/modules/dashboard/service";

/**
 * Shared performance palette for the analytics widgets, so a "tone" maps to the
 * same colour everywhere (bars, rings, badges). Static class strings — Tailwind
 * can see them at build time (no dynamic class names).
 */
export const TONE_BG: Record<Tone, string> = {
  excellent: "bg-emerald-500",
  good: "bg-brand-500",
  fair: "bg-amber-500",
  weak: "bg-slate-400",
  fail: "bg-rose-500",
};

export const TONE_STROKE: Record<Tone, string> = {
  excellent: "stroke-emerald-500",
  good: "stroke-brand-500",
  fair: "stroke-amber-500",
  weak: "stroke-slate-400",
  fail: "stroke-rose-500",
};

export const TONE_TEXT: Record<Tone, string> = {
  excellent: "text-emerald-600",
  good: "text-brand-600",
  fair: "text-amber-600",
  weak: "text-slate-500",
  fail: "text-rose-600",
};

/** Map a 0–100 score to a tone (used for class-average bars, ring colours). */
export function scoreTone(value: number | null, passMark = 40): Tone {
  if (value === null) return "weak";
  if (value >= 75) return "excellent";
  if (value >= 60) return "good";
  if (value >= 50) return "fair";
  if (value >= passMark) return "weak";
  return "fail";
}
