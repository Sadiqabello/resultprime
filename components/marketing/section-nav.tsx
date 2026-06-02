"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const VERIFY = "#bc6c25";

export interface SectionNavItem {
  /** In-page anchor, e.g. "#pricing". */
  href: string;
  label: string;
}

/**
 * Landing-page section nav with an active ("you are here") state. A scrollspy
 * IntersectionObserver tracks which section sits across a thin band near the top
 * of the viewport and marks the matching link `aria-current`. Progressive
 * enhancement: if JS never runs the links still navigate and simply render in
 * their default style. Honors `prefers-reduced-motion` (the underline just has
 * no transition).
 */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const ids = items.map((i) => i.href.replace(/^#/, ""));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0 || !("IntersectionObserver" in window)) return;

    // The set of sections currently crossing the active band; the topmost wins.
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // First section (in document order) that's in the band is the active one.
        const current = ids.find((id) => visible.has(id));
        if (current) setActive(current);
      },
      // A ~thin horizontal line ~40% down the viewport, below the sticky header.
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <div className="hidden items-center gap-6 lg:flex">
      {items.map(({ href, label }) => {
        const isActive = active === href.replace(/^#/, "");
        return (
          <a
            key={href}
            href={href}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "border-b-2 border-transparent pb-0.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors",
              isActive ? "text-[#283618]" : "text-[#283618]/55 hover:text-[#283618]",
            )}
            style={isActive ? { borderColor: VERIFY } : undefined}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}
