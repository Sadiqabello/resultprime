"use client";

import { useEffect } from "react";

/**
 * Tiny progressive-enhancement island for the marketing page.
 *
 * - Reveal: elements with `data-reveal` fade/rise in when scrolled into view.
 * - Count-up: elements with `data-countup="93"` (+ optional `data-suffix`,
 *   `data-prefix`) animate from 0 to the value on reveal.
 *
 * Robustness: the hiding CSS only applies once this mounts (adds `reveal-ready`
 * to <html>), so if JS never runs, ALL content stays visible. Honors
 * `prefers-reduced-motion` by revealing instantly with no animation. Kept
 * deliberately light for low-bandwidth devices.
 */
export function ScrollFx() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("reveal-ready");

    const countUp = (el: HTMLElement) => {
      const raw = el.dataset.countup ?? "0";
      const target = parseFloat(raw);
      if (Number.isNaN(target)) return;
      const prefix = el.dataset.prefix ?? "";
      const suffix = el.dataset.suffix ?? "";
      const isFloat = raw.includes(".");
      const render = (v: number) =>
        prefix + (isFloat ? v.toFixed(1) : Math.round(v).toLocaleString("en-NG")) + suffix;
      if (reduce) {
        el.textContent = render(target);
        return;
      }
      const dur = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = render(target * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const reveal = (el: Element) => {
      el.classList.add("is-revealed");
      el.querySelectorAll<HTMLElement>("[data-countup]").forEach(countUp);
      if (el instanceof HTMLElement && el.hasAttribute("data-countup")) countUp(el);
    };

    const targets = Array.from(document.querySelectorAll("[data-reveal]"));
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <style>{`
      html.reveal-ready [data-reveal]{opacity:0;transform:translateY(20px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
      html.reveal-ready [data-reveal].is-revealed{opacity:1;transform:none}
      html.reveal-ready [data-reveal][data-delay="1"]{transition-delay:.08s}
      html.reveal-ready [data-reveal][data-delay="2"]{transition-delay:.16s}
      html.reveal-ready [data-reveal][data-delay="3"]{transition-delay:.24s}
      html.reveal-ready [data-reveal][data-delay="4"]{transition-delay:.32s}
      html.reveal-ready [data-reveal][data-delay="5"]{transition-delay:.40s}
      @media (prefers-reduced-motion: reduce){html.reveal-ready [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}}
    `}</style>
  );
}
