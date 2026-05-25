import { cn } from "@/lib/utils";

/**
 * Result Prime brand mark — a Times-style serif "R" (Result) fused with a
 * checkmark whose long tail sweeps up to a fine point: results verified, and at
 * their prime.
 *
 * The "R" is a baked vector path (Tinos, an Apache-licensed Times metric clone),
 * so the mark renders identically everywhere — no font dependency. The R uses
 * `currentColor` (Black Forest ink on light surfaces, cornsilk/white on dark);
 * the check is always Copper. The mark is wider than tall, so size it by HEIGHT
 * (`h-8 w-auto`).
 *
 * `LogoMark` defaults to brand ink; `LogoMarkMono` inherits `currentColor` for
 * dark surfaces. `Logo` is the horizontal lockup (mark + Fraunces wordmark). On
 * a school subdomain the UI shows the *school's* brand — this is the platform
 * (Result Prime) identity.
 */

// Tinos 400 "R" outline (font units, y-up); placed via the <g> transform below.
const R_PATH =
  "M424 588V80L627 53V0H72V53L231 80V1262L59 1288V1341H638Q890 1341 1010.0 1256.0Q1130 1171 1130 983Q1130 849 1057.0 751.5Q984 654 855 616L1218 80L1363 53V0H1042L665 588ZM931 969Q931 1122 856.5 1186.5Q782 1251 595 1251H424V678H601Q780 678 855.5 744.5Q931 811 931 969Z";
const CHECK = "M39 57 L50 75 L112 10 L57 60 Z";
const CHECK_COPPER = "#bc6c25";

function MarkGuts() {
  return (
    <>
      {/* scale font units → viewBox, flip y, seat the R at the baseline */}
      <g transform="translate(12.92 86) scale(0.0522 -0.0522)">
        <path d={R_PATH} fill="currentColor" />
      </g>
      <path d={CHECK} fill={CHECK_COPPER} />
    </>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 124 100"
      role="img"
      aria-label="Result Prime"
      className={cn("h-8 w-auto text-brand-950", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <MarkGuts />
    </svg>
  );
}

export function LogoMarkMono({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 124 100"
      role="img"
      aria-label="Result Prime"
      className={cn("h-8 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <MarkGuts />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-brand-950", className)}>
      <LogoMarkMono className={cn("h-8 w-auto", markClassName)} />
      {showWordmark ? (
        <span className={cn("font-display text-xl tracking-tight", wordmarkClassName)}>
          <span className="font-normal">Result</span>{" "}
          <span className="font-semibold">Prime</span>
        </span>
      ) : null}
    </span>
  );
}
