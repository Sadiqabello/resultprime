"use client";

import { useEffect, useState } from "react";

const VERIFY = "#bc6c25";
const STEPS = 5; // 0 empty · 1 CA · 2 exam · 3 total · 4 stamped grade+position

/**
 * A looping micro-demo of the core value: raw CA + exam marks tick in, the total
 * computes, then a grade and class position "stamp" on. Pure transitions (no
 * external keyframes); honours prefers-reduced-motion by showing the final
 * state. Decorative — the real engine lives in lib/result-engine.
 */
export function ComputeDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(STEPS - 1);
      return;
    }
    let s = 0;
    const id = setInterval(() => {
      s = (s + 1) % (STEPS + 2); // hold on the stamped state for 2 extra ticks
      setStep(Math.min(s, STEPS - 1));
    }, 900);
    return () => clearInterval(id);
  }, []);

  const at = (n: number) => step >= n;
  const cell = (on: boolean) =>
    `font-display text-2xl font-semibold tabular-nums transition-all duration-500 ${on ? "text-[#283618] opacity-100" : "text-[#283618]/25 opacity-60"}`;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5" data-reveal>
          <span className="inline-flex items-center gap-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-[#283618]/45">
            <span className="size-[5px] rotate-45" style={{ backgroundColor: VERIFY }} />
            Watch it compute
          </span>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl">
            Raw marks in. A defensible result out.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#5b6048]">
            CA and exam scores become a total, a grade against your bands, and a
            class position — computed the same way every time, then locked and
            QR-verified on approval.
          </p>
        </div>

        {/* the computing slip */}
        <div className="lg:col-span-7" data-reveal data-delay="1">
          <div className="relative overflow-hidden rounded-lg border border-[#283618]/20 bg-white shadow-[0_30px_60px_-34px_rgba(40,54,24,0.35)]">
            <div className="flex items-center justify-between border-b border-[#283618]/12 bg-white px-5 py-3">
              <p className="font-display text-sm font-semibold text-[#283618]">Mathematics · JSS 2 A</p>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: VERIFY }}>
                Computing
              </span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-[#283618]/10 text-center">
              {[
                ["Continuous · /40", at(1) ? "34" : "—", at(1)],
                ["Exam · /60", at(2) ? "54" : "—", at(2)],
                ["Total · /100", at(3) ? "88" : "—", at(3)],
              ].map(([label, val, on], i) => (
                <div key={i} className="bg-white px-3 py-6">
                  <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#283618]/40">{label as string}</p>
                  <p className={`mt-2 ${cell(Boolean(on))} ${i === 2 && at(3) ? "!text-[#283618]" : ""}`}>{val as string}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#283618]/12 bg-white px-5 py-5">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#283618]/40">Grade · Position</p>
                <p className="mt-1 font-display text-lg font-semibold text-[#283618]">
                  {at(4) ? "A1 · Excellent · 1st in class" : "awaiting compute…"}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 -rotate-[8deg] flex-col items-center justify-center rounded-[3px] border-[2.5px] px-3 py-1.5 text-center leading-none transition-all duration-500"
                style={{
                  borderColor: VERIFY,
                  color: VERIFY,
                  boxShadow: `inset 0 0 0 1px ${VERIFY}`,
                  opacity: at(4) ? 1 : 0,
                  transform: at(4) ? "rotate(-8deg) scale(1)" : "rotate(-8deg) scale(0.7)",
                }}
                aria-hidden
              >
                <span className="font-sans text-[8px] font-bold tracking-[0.3em]">RESULT PRIME</span>
                <span className="mt-0.5 font-display text-[15px] font-bold uppercase tracking-[0.18em]">A1</span>
                <span className="mt-0.5 font-sans text-[7.5px] font-medium tracking-[0.22em]">VERIFIED</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
