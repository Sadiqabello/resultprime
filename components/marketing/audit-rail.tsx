"use client";

import { useEffect, useState } from "react";

const VERIFY = "#bc6c25";

/**
 * A thin "audit line" down the left margin that fills as you scroll — a quiet
 * scrollytelling thread reinforcing the ledger/record metaphor. Desktop only,
 * non-interactive; prefers-reduced-motion shows it filled.
 */
export function AuditRail() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPct(100);
      return;
    }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed left-2 top-0 z-40 hidden h-full w-px bg-[#283618]/10 lg:block xl:left-4">
      <div className="w-px" style={{ height: `${pct}%`, backgroundColor: VERIFY, transition: "height 120ms linear" }} />
    </div>
  );
}
