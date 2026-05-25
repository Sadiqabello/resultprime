import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { PLANS } from "@/config/plans";
import { ScrollFx } from "@/components/marketing/scroll-fx";
import { Exhibit } from "@/components/marketing/exhibit";
import { exhibitImages } from "@/components/marketing/exhibits-data";
import { ExhibitTabs } from "@/components/marketing/exhibit-tabs";
import { ComputeDemo } from "@/components/marketing/compute-demo";
import { QrVerify } from "@/components/marketing/qr-verify";
import { AuditRail } from "@/components/marketing/audit-rail";
import { PricingTiers, type PricingTier } from "@/components/marketing/pricing-tiers";

export const metadata: Metadata = {
  title: "Trusted result processing for primary & secondary schools",
  description:
    "Result Prime is the official record of every child's term — audited scores, ranked positions, and branded, QR-verified report cards. Computed the same way every time, locked on approval. Built for African classrooms.",
};

/* ─────────────────────────────────────────────────────────────────────────
   Result Prime — landing page · "THE REGISTER"
   Art direction: documents-of-record. Warm paper, navy ink, a crimson red-pen
   accent (#bc6c25) reserved for the "verified" stamp / corrections / one rule.
   Editorial Fraunces type, hairline ledger rules, asymmetric spreads, real
   product screenshots framed as exhibits. No gradients, orbs, dot-grids, or
   tinted-square icon cards.

   ⚠️ PLACEHOLDERS (search "PLACEHOLDER"): CONTACT channels; the <Voices/> quotes
   and the school-count figure are SAMPLE and clearly marked. Nothing fake ships.
   ───────────────────────────────────────────────────────────────────────── */

const VERIFY = "#bc6c25";
// PLACEHOLDER: real channels for "Book a walkthrough" / "Talk to us"
const CONTACT = {
  whatsapp: "https://wa.me/2340000000000",
  email: "mailto:hello@resultprime.com?subject=Result%20Prime%20walkthrough",
};

/* ── Metrics band — honest product figures (swap in real adoption numbers) ── */
function Metrics() {
  const stats: { v: string; suffix: string; label: string }[] = [
    { v: "100", suffix: "%", label: "of report cards QR-verified" },
    { v: "14", suffix: "", label: "day free trial — no card" },
    { v: "1", suffix: "", label: "day to go live, typically" },
    { v: "0", suffix: "", label: "silent edits — every change is logged" },
  ];
  return (
    <section className="border-y border-[#283618]/12 bg-[#f1ead0]/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4" data-reveal>
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p
              className="font-display text-4xl font-medium tabular-nums text-[#283618] sm:text-5xl"
              data-countup={s.v}
              data-suffix={s.suffix}
            >
              0{s.suffix}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-[#5b6048]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="rp-root relative min-h-screen text-[#4a4f3a]">
      <RegisterStyles />
      <OrgSchema />
      <ScrollFx />
      <AuditRail />
      <Masthead />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <ComputeDemo />
        <Exhibits />
        <Engine />
        <Voices />
        <Metrics />
        <Security />
        <Classrooms />
        <Pricing />
        <Faq />
        <SignOff />
      </main>
      <Colophon />
      <MobileCtaBar />
    </div>
  );
}

/* ── Primitives ─────────────────────────────────────────────────────────── */
function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] ${
        light ? "text-white/55" : "text-[#283618]/45"
      }`}
    >
      <span className="size-[5px] rotate-45" style={{ backgroundColor: VERIFY }} />
      {children}
    </span>
  );
}

/** Embossed circular seal (SVG, crimson on paper or reversed). */
function Seal({ className = "", tone = "crimson" }: { className?: string; tone?: "crimson" | "light" }) {
  const c = tone === "crimson" ? VERIFY : "#FFFFFF";
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Verified record seal">
      <defs>
        <path id="seal-arc" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={c} strokeWidth="2" />
      <circle cx="60" cy="60" r="34" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <text fill={c} className="font-sans" style={{ fontSize: "8px", letterSpacing: "2.5px", fontWeight: 700 }}>
        <textPath href="#seal-arc" startOffset="2%">
          VERIFIED RECORD · RESULT PRIME · AUDITED ·
        </textPath>
      </text>
      {/* the mark's check, centered */}
      <g transform="translate(60 60) scale(1.05)">
        <path d="M-13 2 L-3 13 L17 -12" fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A real product screenshot, framed as an exhibit (app window or printed sheet). */
// Exhibit (browser-framed screenshot) now lives in
// components/marketing/exhibit.tsx — next/image with a blur-up reveal.

/* ── Masthead ───────────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Result Prime">
      <LogoMark className="h-7 w-auto" />
      <span className="font-display text-lg tracking-tight text-[#283618]">
        <span className="font-normal">Result</span> <span className="font-semibold">Prime</span>
      </span>
    </Link>
  );
}

function Masthead() {
  const links = [
    ["#how", "How it works"],
    ["#features", "The engine"],
    ["#security", "On the record"],
    ["#pricing", "Fees"],
    ["#faq", "Appendix"],
  ];
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-double border-[#283618]/25 bg-[#fefae0]/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Wordmark />
        <div className="hidden items-center gap-6 lg:flex">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#283618]/55 transition-colors hover:text-[#283618]"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <a href={CONTACT.whatsapp} className="hidden items-center gap-1.5 px-2 font-sans text-sm font-medium text-[#283618] hover:opacity-70 md:inline-flex">
            <MessageCircle className="size-4" /> Talk to us
          </a>
          <Link href="/login" className="hidden px-2 font-sans text-sm font-medium text-[#283618] hover:opacity-70 sm:block">
            Sign in
          </Link>
          <Button asChild className="rounded-sm bg-[#283618] hover:bg-[#283618]/90">
            <Link href="/signup">Create your school</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  const facts = ["Audited", "NDPR-aligned", "QR-verified", "Daily backups", "Live in a day"];
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-20 sm:pt-24 lg:grid-cols-12 lg:gap-10 lg:pt-28">
        {/* Left — copy */}
        <div className="lg:col-span-6">
          <div className="animate-fade-up"><Kicker>Result processing</Kicker></div>
          <h1
            className="mt-7 max-w-xl animate-fade-up font-display text-[2.7rem] font-medium leading-[1.03] tracking-[-0.02em] text-[#283618] sm:text-[3.4rem]"
            style={{ animationDelay: "70ms" }}
          >
            The{" "}
            <span className="relative italic">
              official
              <svg aria-hidden viewBox="0 0 240 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full" style={{ color: VERIFY }}>
                <path className="rp-underline" d="M2 7 C 70 2, 170 2, 238 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            record of every child&apos;s term.
          </h1>
          <p className="mt-6 max-w-md animate-fade-up text-[17px] leading-relaxed text-[#5b6048]" style={{ animationDelay: "140ms" }}>
            Result Prime turns raw scores into audited, ranked, QR-verified report
            cards — computed the same way every time, and locked on approval.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "210ms" }}>
            <Button asChild size="lg" className="h-11 rounded-sm bg-[#283618] px-6 hover:bg-[#283618]/90">
              <Link href="/signup">
                Create your school <ArrowRight className="size-4" />
              </Link>
            </Button>
            <a href={CONTACT.whatsapp} className="group inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-[#283618]">
              <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Book a walkthrough</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <p className="mt-7 animate-fade-up font-sans text-[13px] text-[#283618]/45" style={{ animationDelay: "280ms" }}>
            <span style={{ color: VERIFY }}>*</span> Free to start. No card. Live in a day.
          </p>
        </div>

        {/* Right — the published report card, framed */}
        <div className="relative animate-fade-up lg:col-span-6" style={{ animationDelay: "180ms" }}>
          <div className="relative mx-auto max-w-md lg:ml-auto lg:max-w-none lg:pl-6">
            <Exhibit
              src={exhibitImages.report}
              alt="A published, QR-verified Result Prime report card"
              url="greenfield.rps.com/portal"
              aspect="20 / 13"
              position="center"
              priority
            />
            <QrVerify className="absolute -right-3 -top-3 hidden sm:flex" />
            <Seal className="rp-stamp absolute -bottom-6 -left-4 size-20 drop-shadow-[0_8px_16px_rgba(10,17,48,0.18)] sm:size-24" />
          </div>
        </div>
      </div>

      {/* trust facts on a rule */}
      <div className="border-y border-[#283618]/12 bg-[#f1ead0]/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3.5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#283618]/55">
          {facts.map((f, i) => (
            <span key={f} className="inline-flex items-center gap-6">
              {i > 0 ? <span className="text-[#283618]/20">·</span> : null}
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── §01 The problem (red-pen ledger) ───────────────────────────────────── */
function Problem() {
  const manual = [
    "Totals & positions compiled by hand, late into the night",
    "Averaging and ranking slips nobody catches until a parent does",
    "Results that can be quietly changed after they're set",
    "Parents waiting weeks — then queuing to dispute a grade",
  ];
  const ours = [
    "Positions, averages and promotion computed identically, every time",
    "Every score change recorded against who made it, and when",
    "Results lock on approval — no silent edits, on the record",
    "Parents get QR-verified report cards the moment you publish",
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5" data-reveal>
          <Kicker>The result-season problem</Kicker>
          <p className="mt-6 font-display text-[1.9rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#283618] sm:text-[2.5rem]">
            A single transposed mark can change a class position — and a parent&apos;s{" "}
            <span className="italic" style={{ color: VERIFY }}>trust</span>.
          </p>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#5b6048]">
            The manual way is slow, error-prone, and impossible to audit. The
            record should be exact, and it should be defensible.
          </p>
        </div>

        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-7" data-reveal data-delay="1">
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#283618]/40">The manual way</p>
            <ul className="mt-4 divide-y divide-[#283618]/10">
              {manual.map((m) => (
                <li key={m} className="flex items-start gap-3 py-3 text-[14.5px] leading-snug text-[#283618]/55">
                  <span aria-hidden className="mt-1 font-display text-base leading-none line-through" style={{ color: VERIFY, opacity: 0.7 }}>✗</span>
                  <span className="line-through decoration-[#283618]/25">{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: VERIFY }}>
              On the record
            </p>
            <ul className="mt-4 divide-y divide-[#283618]/10">
              {ours.map((o) => (
                <li key={o} className="flex items-start gap-3 py-3 text-[14.5px] leading-snug text-[#283618]">
                  <span aria-hidden className="mt-0.5 font-display text-base font-bold leading-none" style={{ color: VERIFY }}>✓</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── §02 How it works (register) ────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    ["01", "Set up your school", "Sessions, terms, classes, subjects and your grading system — guided, with sensible defaults."],
    ["02", "Capture scores", "Teachers enter marks on any phone, or import from Excel with a previewed, validated upload."],
    ["03", "Compute & rank", "Run the engine, review the broadsheet, and route results through your approval workflow."],
    ["04", "Publish & seal", "Release to parents and print branded, QR-verified report cards for the whole class."],
  ];
  return (
    <section id="how" className="scroll-mt-20 border-y border-[#283618]/12 bg-[#f1ead0]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div data-reveal><Kicker>How it works</Kicker></div>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl" data-reveal>
          Four entries, start to finish.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden border-y border-[#283618]/12 md:grid-cols-2 lg:grid-cols-4 lg:border lg:border-[#283618]/12">
          {steps.map(([n, title, desc], i) => (
            <div
              key={n}
              className="border-t border-[#283618]/12 bg-[#fefae0] p-7 first:border-t-0 md:border-t-0 lg:border-l lg:border-t-0 lg:first:border-l-0"
              data-reveal
              data-delay={(i + 1) as 1 | 2 | 3 | 4}
            >
              <span className="font-display text-5xl font-light text-[#283618]/25">{n}</span>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#283618]">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5b6048]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Exhibits (real product screenshots) ────────────────────────────────── */
function Exhibits() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="max-w-2xl" data-reveal>
        <Kicker>Exhibits · the real software</Kicker>
        <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl">
          Not a mockup. The actual record.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#5b6048]">
          Every screen here is the working product — score entry, the computed
          broadsheet, the published report card.
        </p>
      </div>

      <ExhibitTabs />
    </section>
  );
}

/* ── §03 The engine & trust (with crafted audit ledger) ─────────────────── */
function Engine() {
  const points = [
    ["Deterministic engine", "Totals, averages, subject & class positions, remarks and promotion — never by hand."],
    ["Configurable grading", "Your grade bands, CA/exam weights and position rules, set per session and level."],
    ["Approvals & locking", "Submit → approve → publish. Results lock on approval; re-opening is deliberate and recorded."],
    ["QR verification", "Each published report card carries a code anyone can scan to confirm it's genuine."],
  ];
  const ledger = [
    ["Mathematics", "78", "82", "Mrs. A. Bello", "12 May · 14:03"],
    ["English Language", "—", "64", "Mr. T. Okeke", "12 May · 14:11"],
    ["Basic Science", "55", "58", "Mrs. A. Bello", "12 May · 15:20"],
    ["Civic Education", "90", "92", "Exam officer", "13 May · 09:02"],
  ];
  return (
    <section id="features" className="scroll-mt-20 border-t border-[#283618]/12 bg-[#f1ead0]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <Kicker>The engine &amp; the trail</Kicker>
            <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight text-[#283618] sm:text-4xl">
              Built on a result engine you can defend.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#5b6048]">
              The same scores always produce the same result. And when anyone asks
              how a grade was reached, the answer is one click away.
            </p>
            <dl className="mt-8 divide-y divide-[#283618]/10 border-y border-[#283618]/12">
              {points.map(([t, d]) => (
                <div key={t} className="py-4">
                  <dt className="font-display text-[17px] font-semibold text-[#283618]">{t}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-[#5b6048]">{d}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* crafted audit ledger artifact */}
          <div className="lg:col-span-7" data-reveal data-delay="1">
            <div className="overflow-hidden rounded-lg border border-[#283618]/15 bg-[#fefae0] shadow-[0_30px_60px_-34px_rgba(10,17,48,0.3)]">
              <div className="flex items-center justify-between border-b border-[#283618]/12 bg-white px-5 py-3">
                <p className="font-display text-sm font-semibold text-[#283618]">Audit trail — JSS 2 A · First Term</p>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: VERIFY }}>
                  Append-only
                </span>
              </div>
              <table className="w-full text-left font-sans text-[13px]">
                <thead>
                  <tr className="border-b border-[#283618]/12 text-[11px] uppercase tracking-[0.12em] text-[#283618]/40">
                    <th className="px-5 py-2.5 font-semibold">Subject</th>
                    <th className="px-2 py-2.5 text-right font-semibold">From</th>
                    <th className="px-2 py-2.5 text-right font-semibold">To</th>
                    <th className="px-3 py-2.5 font-semibold">Changed by</th>
                    <th className="px-5 py-2.5 text-right font-semibold">When</th>
                  </tr>
                </thead>
                <tbody className="text-[#283618]">
                  {ledger.map((r, i) => (
                    <tr key={i} className="border-b border-[#283618]/8 last:border-0">
                      <td className="px-5 py-3">{r[0]}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-[#283618]/50">{r[1]}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums">{r[2]}</td>
                      <td className="px-3 py-3 text-[#5b6048]">{r[3]}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-[#283618]/50">{r[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#283618]/12 bg-white px-5 py-2.5 font-sans text-[11px] text-[#283618]/45">
                Every entry is permanent. Nothing happens off the record.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── §04 Voices (proof — sample, clearly marked) ────────────────────────── */
function Voices() {
  // PLACEHOLDER: replace with REAL quotes. Generic attributions + "sample" tag so
  // nothing reads as a fabricated named customer.
  const lead = {
    quote:
      "Compilation that used to swallow a week now takes an afternoon — and when a parent questions a grade, I can show exactly how it was reached.",
    who: "Head Teacher · secondary school, Lagos",
  };
  const side = [
    { quote: "Teachers enter scores on their own phones. No more chasing paper score sheets.", who: "Exam Officer" },
    { quote: "The QR code on each report card ended the arguments about whether a result is genuine.", who: "Proprietor" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
        <div>
          <Kicker>What schools say</Kicker>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl">
            For the people who run results.
          </h2>
        </div>
        <span className="rounded-sm border border-dashed border-[#283618]/25 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-[#283618]/40">
          Sample — replace with real quotes
        </span>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <figure className="lg:col-span-7" data-reveal>
          <p className="font-display text-2xl font-medium leading-[1.25] tracking-[-0.01em] text-[#283618] sm:text-[2rem]">
            <span style={{ color: VERIFY }}>“</span>
            {lead.quote}
            <span style={{ color: VERIFY }}>”</span>
          </p>
          <figcaption className="mt-6 font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-[#283618]/50">
            — {lead.who}
          </figcaption>
        </figure>
        <div className="grid gap-8 lg:col-span-5" data-reveal data-delay="1">
          {side.map((s, i) => (
            <figure key={i} className="border-l-2 pl-5" style={{ borderColor: VERIFY }}>
              <p className="text-[15.5px] leading-relaxed text-[#283618]">“{s.quote}”</p>
              <figcaption className="mt-3 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#283618]/45">— {s.who}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Security ("On the record") — flat navy, no gradient ────────────────── */
function Security() {
  const guarantees = [
    ["Role-based access", "Teachers see only their classes. Approvals, billing and exports stay with the people you choose."],
    ["Locked on approval", "Approved results can't be silently edited; re-opening is deliberate and recorded."],
    ["Full audit trail", "Every score change is stamped with who made it and when."],
    ["QR-verified results", "Published report cards carry a code anyone can scan to confirm authenticity."],
    ["Daily backups", "Automated backups with point-in-time recovery — a bad day never loses a result."],
    ["NDPR-aligned", "Each school's data is isolated and handled in line with Nigeria's data-protection rules."],
    ["Your data is yours", "Export results, broadsheets and report cards to PDF and Excel anytime."],
    ["Secure billing", "Payments run through a trusted, PCI-compliant gateway — we never store card details."],
  ];
  return (
    <section id="security" className="scroll-mt-20 bg-[#283618] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <Kicker light>On the record</Kicker>
            <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Your school&apos;s data, kept on the record.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70">
              Results are sensitive and money is involved. With Result Prime, trust
              isn&apos;t a promise — it&apos;s enforced by the system.
            </p>
            <div className="mt-10 hidden lg:block">
              <Seal className="size-28" tone="light" />
            </div>
          </div>

          <div className="lg:col-span-7" data-reveal data-delay="1">
            <ol className="grid gap-x-10 sm:grid-cols-2">
              {guarantees.map(([t, d], i) => (
                <li key={t} className="flex gap-4 border-t border-white/15 py-5">
                  <span className="font-display text-sm font-medium tabular-nums text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-[16px] font-semibold text-white">{t}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Built for classrooms ───────────────────────────────────────────────── */
function Classrooms() {
  const items = [
    ["Phone-first", "Teachers enter scores on the cheapest Android — no computer lab required."],
    ["Low-bandwidth", "Light pages and autosaved drafts survive shaky connections and power cuts."],
    ["Excel-friendly", "Keep your spreadsheets — import them with a safety preview before anything saves."],
    ["Your brand", "Your logo, colours and signatures on every report card you publish."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start" data-reveal>
          <Kicker>Made for real classrooms</Kicker>
          <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight text-[#283618] sm:text-4xl">
            Designed for how African schools actually work.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#5b6048]">
            The most elegant system loses to the one that works on a cheap phone
            with two bars of signal. We built for that reality first.
          </p>
          <a href={CONTACT.whatsapp} className="mt-7 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-[#283618]">
            <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Talk to our team</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
        <dl className="lg:col-span-7" data-reveal data-delay="1">
          <div className="border-t border-[#283618]/12">
            {items.map(([t, d], i) => (
              <div key={t} className="flex gap-6 border-b border-[#283618]/12 py-6">
                <span className="font-display text-sm tabular-nums text-[#283618]/30">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <dt className="font-display text-lg font-semibold text-[#283618]">{t}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-[#5b6048]">{d}</dd>
                </div>
              </div>
            ))}
          </div>
        </dl>
      </div>
    </section>
  );
}

/* ── Pricing ("Fees schedule") ──────────────────────────────────────────── */
function Pricing() {
  const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  const standard = PLANS.find((p) => p.key === "standard");
  const pro = PLANS.find((p) => p.key === "pro");
  const perStudent = standard ? Math.round(standard.amount / standard.maxStudents) : null;

  const tiers: PricingTier[] = [
    { name: "Trial", annual: null, freeLabel: "Free", unitYear: "14 days", desc: "Set up your school and print a sample report card. No card required.", features: ["Full feature access", "Report cards & broadsheets", "Bulk Excel import"], cta: "Start free", featured: false },
    { name: standard?.name ?? "Standard", annual: standard?.amount ?? null, unitYear: "/ year", desc: "Everything a school needs to run results end to end.", features: standard?.features ?? [], cta: "Create your school", featured: true },
    { name: pro?.name ?? "Pro", annual: pro?.amount ?? null, unitYear: "/ year", desc: "For larger schools that need branding and priority support.", features: pro?.features ?? [], cta: "Choose Pro", featured: false },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-y border-[#283618]/12 bg-[#f1ead0]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <div>
            <Kicker>Fees schedule</Kicker>
            <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl">One price for your whole school.</h2>
          </div>
          <p className="max-w-xs font-sans text-[13px] leading-relaxed text-[#283618]/50">
            Unlimited teachers, no per-seat fees{perStudent ? ` — from about ${ngn(perStudent)} per student a year.` : "."}
          </p>
        </div>

        <PricingTiers tiers={tiers} />

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#283618]/12 pt-7 sm:flex-row" data-reveal>
          <p className="font-sans text-[14px] text-[#5b6048]">
            <span className="font-display text-[16px] font-semibold text-[#283618]">Running many schools?</span>{" "}
            Proprietors and groups get one console, custom subdomains and onboarding help.
          </p>
          <a href={CONTACT.whatsapp} className="inline-flex shrink-0 items-center gap-1.5 font-sans text-sm font-semibold text-[#283618]">
            <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Talk to us</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
        <p className="mt-6 text-center font-sans text-[12px] uppercase tracking-[0.14em] text-[#283618]/40">
          Cancel anytime · Export your data anytime · Secure online billing
        </p>
      </div>
    </section>
  );
}

/* ── Appendix (FAQ) + schema ────────────────────────────────────────────── */
const FAQS: { q: string; a: string }[] = [
  { q: "How long does setup take?", a: "Most schools are live in a day. A guided checklist walks you through sessions, classes, subjects, grading and your roster — with sensible defaults you can adjust later." },
  { q: "Can I move my existing results in?", a: "Yes. Teachers fill a familiar Excel template and you bulk-import a whole class, previewing every change before it saves — and rolling back an entire import if something looks wrong." },
  { q: "Do teachers need training?", a: "No. Score entry works like a spreadsheet, autosaves as they go, and each teacher only ever sees the classes assigned to them." },
  { q: "Can results be tampered with?", a: "Every score change is recorded against who made it and when, results lock on approval, and each published report card carries a QR code anyone can scan to verify it's genuine." },
  { q: "Does it work on cheap phones and poor internet?", a: "It's phone-first and light. Pages stay small, score entry saves drafts, and bulk Excel import means a whole class can be captured offline and uploaded later." },
  { q: "Can I use my own grading system?", a: "Yes — grade bands, CA/exam weights, position and promotion rules are all configuration, set per session and level. Historical results always recompute exactly as they were." },
  { q: "Who owns the data, and can I leave?", a: "Your data is yours. You can export results, broadsheets and report cards to PDF and Excel at any time, and cancel whenever you like." },
];

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20 lg:py-28">
      <div data-reveal><Kicker>Appendix · questions</Kicker></div>
      <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#283618] sm:text-4xl" data-reveal>Questions, answered.</h2>
      <div className="mt-10 border-t border-[#283618]/15" data-reveal>
        {FAQS.map((f, i) => (
          <details key={f.q} className="group border-b border-[#283618]/12 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5">
              <span className="font-display text-sm tabular-nums text-[#283618]/30">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-display text-[18px] font-medium text-[#283618]">{f.q}</span>
              <span className="font-display text-xl text-[#283618]/40 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-6 pl-9 pr-8 text-[15px] leading-relaxed text-[#5b6048]">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── Sign-off (final CTA, flat navy, stamped) ───────────────────────────── */
function SignOff() {
  return (
    <section className="px-6 pb-24 lg:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg bg-[#283618] px-8 py-16 text-white sm:px-16" data-reveal>
        <div className="absolute right-8 top-8 hidden sm:block"><Seal className="size-24" tone="light" /></div>
        <Kicker light>Start this term&apos;s records</Kicker>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-[2.75rem]">
          Turn this term&apos;s scores into results parents trust.
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/70">
          Start free today — most schools are live in a day. Bring a demo question?
          We&apos;re a message away.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild size="lg" className="h-11 rounded-sm bg-white px-6 text-[#283618] hover:bg-white/90">
            <Link href="/signup">
              Create your school <ArrowRight className="size-4" />
            </Link>
          </Button>
          <a href={CONTACT.whatsapp} className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-white">
            <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Book a walkthrough</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Colophon (footer) ──────────────────────────────────────────────────── */
function Colophon() {
  const cols: { title: string; links: [string, string][] }[] = [
    { title: "Product", links: [["How it works", "#how"], ["The engine", "#features"], ["On the record", "#security"], ["Fees", "#pricing"], ["Appendix", "#faq"]] },
    { title: "Account", links: [["Create your school", "/signup"], ["Sign in", "/login"]] },
    { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
  ];
  return (
    <footer className="border-t-[3px] border-double border-[#283618]/25 bg-[#fefae0]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#5b6048]">
            The official record of every child&apos;s term — audited, branded and
            QR-verified. Built for real classrooms.
          </p>
          <div className="mt-5 flex flex-col gap-1.5 font-sans text-sm text-[#5b6048]">
            <a href={CONTACT.whatsapp} className="inline-flex items-center gap-2 hover:text-[#283618]">
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
            <a href={CONTACT.email} className="inline-flex items-center gap-2 hover:text-[#283618]">
              <ArrowRight className="size-4" /> hello@resultprime.com
            </a>
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#283618]/45">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-[#5b6048] hover:text-[#283618]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#283618]/12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 font-sans text-[12px] text-[#283618]/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Result Prime. Results, at their prime.</p>
          <p className="inline-flex items-center gap-1.5">Made in Nigeria for African schools</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Sticky mobile CTA ──────────────────────────────────────────────────── */
function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#283618]/15 bg-[#fefae0]/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <Button asChild className="h-11 flex-1 rounded-sm bg-[#283618] hover:bg-[#283618]/90">
          <Link href="/signup">Create your school</Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="size-11 shrink-0 rounded-sm border-[#283618]/30" aria-label="Book a walkthrough on WhatsApp">
          <a href={CONTACT.whatsapp}>
            <MessageCircle className="size-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ── Paper texture + base ───────────────────────────────────────────────── */
function RegisterStyles() {
  return (
    <style>{`
      .rp-root{
        background-color:#fefae0;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
      }
      @media (prefers-reduced-motion: no-preference){
        @keyframes rp-stamp-in{0%{opacity:0;transform:rotate(-14deg) scale(.4)}60%{opacity:1;transform:rotate(4deg) scale(1.08)}100%{opacity:1;transform:rotate(0) scale(1)}}
        .rp-stamp{animation:rp-stamp-in .7s cubic-bezier(.2,1.2,.3,1) .5s both}
        @keyframes rp-draw{to{stroke-dashoffset:0}}
        .rp-underline{stroke-dasharray:240;stroke-dashoffset:240;animation:rp-draw .9s ease-out .45s forwards}
      }
    `}</style>
  );
}

/* ── SEO: Organization + FAQ structured data ────────────────────────────── */
function OrgSchema() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Result Prime", description: "Audited, branded, QR-verified result processing for primary & secondary schools.", slogan: "Results, at their prime." },
      { "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
