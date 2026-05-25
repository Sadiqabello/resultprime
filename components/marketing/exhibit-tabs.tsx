"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Exhibit } from "./exhibit";
import { exhibitImages } from "./exhibits-data";

const VERIFY = "#bc6c25";

const PLATES = [
  {
    key: "scores",
    tab: "Score entry",
    src: exhibitImages.scores,
    url: "resultprime.com/scores",
    position: "top left",
    caption:
      "Teachers enter CA and exam marks on any phone. It autosaves, validates against the obtainable, and imports from Excel — locked the moment results are approved.",
  },
  {
    key: "broadsheet",
    tab: "Broadsheet",
    src: exhibitImages.broadsheet,
    url: "resultprime.com/results",
    position: "top left",
    caption:
      "Positions, averages and grades computed the same way every time, against your own grade bands. Export to PDF and Excel in one click.",
  },
  {
    key: "report",
    tab: "Report card",
    src: exhibitImages.report,
    url: "greenfield.rps.com/portal",
    position: "center",
    caption:
      "The published, QR-verified report card families receive — your logo, your grade bands, your signatures.",
  },
] as const;

/** Tabbed product gallery: flip between the three real screens in one frame. */
export function ExhibitTabs() {
  const [active, setActive] = useState(0);
  const plate = PLATES[active]!;
  return (
    <div className="mt-12" data-reveal>
      <div role="tablist" aria-label="Product screens" className="flex flex-wrap gap-2">
        {PLATES.map((p, i) => {
          const on = i === active;
          return (
            <button
              key={p.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-sm border px-4 py-2 font-sans text-[13px] font-semibold transition-colors",
                on
                  ? "border-transparent bg-[#283618] text-white"
                  : "border-[#283618]/20 text-[#283618]/70 hover:border-[#283618]/40 hover:text-[#283618]",
              )}
            >
              {p.tab}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/* key forces a fresh fade as the plate changes */}
          <div key={plate.key} className="animate-fade-up">
            <Exhibit src={plate.src} alt={`${plate.tab} in Result Prime`} url={plate.url} position={plate.position} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <p className="font-display text-xl text-[#283618]">{plate.tab}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5b6048]">{plate.caption}</p>
          <span className="mt-5 inline-flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: VERIFY }}>
            <span className="size-[5px] rotate-45" style={{ backgroundColor: VERIFY }} />
            Live product
          </span>
        </div>
      </div>
    </div>
  );
}
