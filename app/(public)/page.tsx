import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { PLANS } from "@/config/plans";
import { ScrollFx } from "@/components/marketing/scroll-fx";

export const metadata: Metadata = {
  title: "Trusted result processing for primary & secondary schools",
  description:
    "Result Prime is the official record of every child's term — audited scores, ranked positions, and branded, QR-verified report cards. Computed the same way every time, locked on approval. Built for African classrooms.",
};

/* ─────────────────────────────────────────────────────────────────────────
   Result Prime — landing page · "THE REGISTER"
   Art direction: documents-of-record. Warm paper, navy ink, a crimson red-pen
   accent (#D62F3A) reserved for the "verified" stamp / corrections / one rule.
   Editorial Fraunces type, hairline ledger rules, asymmetric spreads, real
   product screenshots framed as exhibits. No gradients, orbs, dot-grids, or
   tinted-square icon cards.

   ⚠️ PLACEHOLDERS (search "PLACEHOLDER"): CONTACT channels; the <Voices/> quotes
   and the school-count figure are SAMPLE and clearly marked. Nothing fake ships.
   ───────────────────────────────────────────────────────────────────────── */

const VERIFY = "#D62F3A";
// PLACEHOLDER: real channels for "Book a walkthrough" / "Talk to us"
const CONTACT = {
  whatsapp: "https://wa.me/2340000000000",
  email: "mailto:hello@resultprime.com?subject=Result%20Prime%20walkthrough",
};
const EXHIBITS = {
  report: "/marketing/report-card.jpg",
  broadsheet: "/marketing/broadsheet.jpg",
  scores: "/marketing/score-entry.jpg",
};

export default function LandingPage() {
  return (
    <div className="rp-root relative min-h-screen text-[#3f4458]">
      <RegisterStyles />
      <OrgSchema />
      <ScrollFx />
      <Masthead />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Exhibits />
        <Engine />
        <Voices />
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
function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-[#0a1130]/15 ${className}`} />;
}

function Kicker({ n, children, light = false }: { n?: string; children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] ${
        light ? "text-white/55" : "text-[#0a1130]/45"
      }`}
    >
      {n ? (
        <span style={{ color: VERIFY }} className="font-display text-sm not-italic">
          §{n}
        </span>
      ) : (
        <span className="size-[5px] rotate-45" style={{ backgroundColor: VERIFY }} />
      )}
      {children}
    </span>
  );
}

/** A field label / value pair, like a line on a registration form. */
function Field({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a1130]/40">{label}</p>
      <p className="mt-0.5 font-display text-[15px] text-[#0a1130]">{value}</p>
    </div>
  );
}

/** Crimson rubber stamp. */
function Stamp({ className = "", date = "23 · 05 · 2026" }: { className?: string; date?: string }) {
  return (
    <span
      className={`inline-flex -rotate-[9deg] select-none flex-col items-center justify-center rounded-[3px] border-[2.5px] px-3.5 py-1.5 text-center leading-none ${className}`}
      style={{ borderColor: VERIFY, color: VERIFY, boxShadow: `inset 0 0 0 1px ${VERIFY}` }}
      aria-hidden
    >
      <span className="font-sans text-[8px] font-bold tracking-[0.3em]">RESULT PRIME</span>
      <span className="mt-0.5 font-display text-[17px] font-bold uppercase tracking-[0.18em]">Verified</span>
      <span className="mt-0.5 font-sans text-[7.5px] font-medium tracking-[0.22em]">{date}</span>
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
function Exhibit({
  src,
  alt,
  url,
  aspect = "16 / 10",
  position = "top center",
  className = "",
  rotate = "0deg",
}: {
  src: string;
  alt: string;
  url: string;
  aspect?: string;
  position?: string;
  className?: string;
  rotate?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-lg border border-[#0a1130]/12 bg-white shadow-[0_30px_60px_-30px_rgba(10,17,48,0.35)] ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      <figcaption className="flex items-center gap-2 border-b border-[#0a1130]/10 bg-[#F3EEE2] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
        </span>
        <span className="ml-2 truncate rounded bg-white px-2.5 py-0.5 font-sans text-[11px] text-[#0a1130]/45 ring-1 ring-[#0a1130]/10">
          {url}
        </span>
      </figcaption>
      <div className="bg-white" style={{ aspectRatio: aspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full" style={{ objectFit: "cover", objectPosition: position }} />
      </div>
    </figure>
  );
}

/* ── Masthead ───────────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Result Prime">
      <LogoMark className="h-7 w-auto" />
      <span className="font-display text-lg tracking-tight text-[#0a1130]">
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
    <header className="sticky top-0 z-50 border-b-[3px] border-double border-[#0a1130]/25 bg-[#FAF7EF]/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Wordmark />
        <div className="hidden items-center gap-6 lg:flex">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0a1130]/55 transition-colors hover:text-[#0a1130]"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <a href={CONTACT.whatsapp} className="hidden items-center gap-1.5 px-2 font-sans text-sm font-medium text-[#0a1130] hover:opacity-70 md:inline-flex">
            <MessageCircle className="size-4" /> Talk to us
          </a>
          <Link href="/login" className="hidden px-2 font-sans text-sm font-medium text-[#0a1130] hover:opacity-70 sm:block">
            Sign in
          </Link>
          <Button asChild className="rounded-sm bg-[#0a1130] hover:bg-[#0a1130]/90">
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
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* metadata margin */}
          <aside className="animate-fade-up lg:col-span-3 lg:border-r lg:border-[#0a1130]/12 lg:pr-6" style={{ animationDelay: "60ms" }}>
            <div className="space-y-4">
              <Field label="Document" value="Term result record" />
              <Rule />
              <Field label="For" value="Primary & secondary" />
              <Rule />
              <Field label="Status" value={<span style={{ color: VERIFY }}>Trial open</span>} />
              <Rule />
              <Field label="Region" value="Nigeria" />
            </div>
          </aside>

          {/* main column */}
          <div className="lg:col-span-9">
            <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="animate-fade-up"><Kicker>Result processing</Kicker></div>
                <h1
                  className="mt-5 animate-fade-up font-display text-[2.6rem] font-medium leading-[1.02] tracking-[-0.02em] text-[#0a1130] sm:text-6xl"
                  style={{ animationDelay: "70ms" }}
                >
                  The{" "}
                  <span className="relative italic">
                    official
                    <svg aria-hidden viewBox="0 0 240 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full" style={{ color: VERIFY }}>
                      <path d="M2 7 C 70 2, 170 2, 238 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>{" "}
                  record of every child&apos;s term.
                </h1>
                <p className="mt-6 max-w-md animate-fade-up text-[17px] leading-relaxed text-[#4f5468]" style={{ animationDelay: "140ms" }}>
                  Result Prime turns raw scores into audited, ranked, QR-verified
                  report cards — computed the same way every time, locked on
                  approval, signed and sealed.
                </p>
                <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "210ms" }}>
                  <Button asChild size="lg" className="h-11 rounded-sm bg-[#0a1130] px-6 hover:bg-[#0a1130]/90">
                    <Link href="/signup">
                      Create your school <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <a href={CONTACT.whatsapp} className="group inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-[#0a1130]">
                    <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Book a walkthrough</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
                <p className="mt-6 max-w-sm animate-fade-up font-sans text-[13px] leading-relaxed text-[#0a1130]/45" style={{ animationDelay: "280ms" }}>
                  <span style={{ color: VERIFY }}>*</span> Free to start. No card. Live in a day. Your records, exportable anytime.
                </p>
              </div>

              {/* hero exhibit: the report card, stamped */}
              <div className="relative animate-fade-up" style={{ animationDelay: "180ms" }}>
                <Exhibit
                  src={EXHIBITS.report}
                  alt="A published Result Prime report card for a JSS 2 student"
                  url="resultprime.com/report-card.pdf"
                  aspect="5 / 4"
                  position="top center"
                  rotate="1.2deg"
                />
                <div className="absolute -right-3 -top-4 z-10 sm:-right-5">
                  <Stamp />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* trust facts on a rule */}
      <div className="border-y border-[#0a1130]/12 bg-[#F3EEE2]/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3.5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0a1130]/55">
          {facts.map((f, i) => (
            <span key={f} className="inline-flex items-center gap-6">
              {i > 0 ? <span className="text-[#0a1130]/20">·</span> : null}
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
          <Kicker n="01">The result-season problem</Kicker>
          <p className="mt-6 font-display text-[1.9rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#0a1130] sm:text-[2.5rem]">
            A single transposed mark can change a class position — and a parent&apos;s{" "}
            <span className="italic" style={{ color: VERIFY }}>trust</span>.
          </p>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#4f5468]">
            The manual way is slow, error-prone, and impossible to audit. The
            record should be exact, and it should be defensible.
          </p>
        </div>

        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-7" data-reveal data-delay="1">
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0a1130]/40">The manual way</p>
            <ul className="mt-4 divide-y divide-[#0a1130]/10">
              {manual.map((m) => (
                <li key={m} className="flex items-start gap-3 py-3 text-[14.5px] leading-snug text-[#0a1130]/55">
                  <span aria-hidden className="mt-1 font-display text-base leading-none line-through" style={{ color: VERIFY, opacity: 0.7 }}>✗</span>
                  <span className="line-through decoration-[#0a1130]/25">{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: VERIFY }}>
              On the record
            </p>
            <ul className="mt-4 divide-y divide-[#0a1130]/10">
              {ours.map((o) => (
                <li key={o} className="flex items-start gap-3 py-3 text-[14.5px] leading-snug text-[#0a1130]">
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
    <section id="how" className="scroll-mt-20 border-y border-[#0a1130]/12 bg-[#F3EEE2]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div data-reveal><Kicker n="02">How it works</Kicker></div>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium tracking-tight text-[#0a1130] sm:text-4xl" data-reveal>
          Four entries, start to finish.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden border-y border-[#0a1130]/12 md:grid-cols-2 lg:grid-cols-4 lg:border lg:border-[#0a1130]/12">
          {steps.map(([n, title, desc], i) => (
            <div
              key={n}
              className="border-t border-[#0a1130]/12 bg-[#FAF7EF] p-7 first:border-t-0 md:border-t-0 lg:border-l lg:border-t-0 lg:first:border-l-0"
              data-reveal
              data-delay={(i + 1) as 1 | 2 | 3 | 4}
            >
              <span className="font-display text-5xl font-light text-[#0a1130]/25">{n}</span>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#0a1130]">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#4f5468]">{desc}</p>
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
        <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#0a1130] sm:text-4xl">
          Not a mockup. The actual record.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#4f5468]">
          Every screen here is the working product — score entry, the computed
          broadsheet, the published report card.
        </p>
      </div>

      {/* Plate A — score entry, with margin annotation */}
      <div className="mt-14 grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8" data-reveal>
          <Exhibit src={EXHIBITS.scores} alt="Score-entry grid in Result Prime" url="resultprime.com/scores" position="top left" />
        </div>
        <div className="lg:col-span-4" data-reveal data-delay="1">
          <p className="font-display text-xl text-[#0a1130]">Plate A — Score entry</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4f5468]">
            Teachers enter CA and exam marks on any phone. It autosaves, validates
            against the obtainable, and imports from Excel. Locked the moment results
            are approved.
          </p>
        </div>
      </div>

      {/* Plate B — broadsheet (flipped) */}
      <div className="mt-16 grid items-center gap-8 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-4" data-reveal>
          <p className="font-display text-xl text-[#0a1130]">Plate B — The broadsheet</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4f5468]">
            Positions, averages and grades computed the same way every time, against
            your own grade bands. Export to PDF and Excel in one click.
          </p>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-8" data-reveal data-delay="1">
          <Exhibit src={EXHIBITS.broadsheet} alt="Class broadsheet in Result Prime" url="resultprime.com/results" position="top left" />
        </div>
      </div>
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
    <section id="features" className="scroll-mt-20 border-t border-[#0a1130]/12 bg-[#F3EEE2]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <Kicker n="03">The engine &amp; the trail</Kicker>
            <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight text-[#0a1130] sm:text-4xl">
              Built on a result engine you can defend.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#4f5468]">
              The same scores always produce the same result. And when anyone asks
              how a grade was reached, the answer is one click away.
            </p>
            <dl className="mt-8 divide-y divide-[#0a1130]/10 border-y border-[#0a1130]/12">
              {points.map(([t, d]) => (
                <div key={t} className="py-4">
                  <dt className="font-display text-[17px] font-semibold text-[#0a1130]">{t}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-[#4f5468]">{d}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* crafted audit ledger artifact */}
          <div className="lg:col-span-7" data-reveal data-delay="1">
            <div className="overflow-hidden rounded-lg border border-[#0a1130]/15 bg-[#FAF7EF] shadow-[0_30px_60px_-34px_rgba(10,17,48,0.3)]">
              <div className="flex items-center justify-between border-b border-[#0a1130]/12 bg-white px-5 py-3">
                <p className="font-display text-sm font-semibold text-[#0a1130]">Audit trail — JSS 2 A · First Term</p>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: VERIFY }}>
                  Append-only
                </span>
              </div>
              <table className="w-full text-left font-sans text-[13px]">
                <thead>
                  <tr className="border-b border-[#0a1130]/12 text-[11px] uppercase tracking-[0.12em] text-[#0a1130]/40">
                    <th className="px-5 py-2.5 font-semibold">Subject</th>
                    <th className="px-2 py-2.5 text-right font-semibold">From</th>
                    <th className="px-2 py-2.5 text-right font-semibold">To</th>
                    <th className="px-3 py-2.5 font-semibold">Changed by</th>
                    <th className="px-5 py-2.5 text-right font-semibold">When</th>
                  </tr>
                </thead>
                <tbody className="text-[#0a1130]">
                  {ledger.map((r, i) => (
                    <tr key={i} className="border-b border-[#0a1130]/8 last:border-0">
                      <td className="px-5 py-3">{r[0]}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-[#0a1130]/50">{r[1]}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums">{r[2]}</td>
                      <td className="px-3 py-3 text-[#4f5468]">{r[3]}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-[#0a1130]/50">{r[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#0a1130]/12 bg-white px-5 py-2.5 font-sans text-[11px] text-[#0a1130]/45">
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
          <Kicker n="04">What schools say</Kicker>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#0a1130] sm:text-4xl">
            For the people who run results.
          </h2>
        </div>
        <span className="rounded-sm border border-dashed border-[#0a1130]/25 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-[#0a1130]/40">
          Sample — replace with real quotes
        </span>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <figure className="lg:col-span-7" data-reveal>
          <p className="font-display text-2xl font-medium leading-[1.25] tracking-[-0.01em] text-[#0a1130] sm:text-[2rem]">
            <span style={{ color: VERIFY }}>“</span>
            {lead.quote}
            <span style={{ color: VERIFY }}>”</span>
          </p>
          <figcaption className="mt-6 font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0a1130]/50">
            — {lead.who}
          </figcaption>
        </figure>
        <div className="grid gap-8 lg:col-span-5" data-reveal data-delay="1">
          {side.map((s, i) => (
            <figure key={i} className="border-l-2 pl-5" style={{ borderColor: VERIFY }}>
              <p className="text-[15.5px] leading-relaxed text-[#0a1130]">“{s.quote}”</p>
              <figcaption className="mt-3 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0a1130]/45">— {s.who}</figcaption>
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
    <section id="security" className="scroll-mt-20 bg-[#03045E] text-white">
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
          <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight text-[#0a1130] sm:text-4xl">
            Designed for how African schools actually work.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#4f5468]">
            The most elegant system loses to the one that works on a cheap phone
            with two bars of signal. We built for that reality first.
          </p>
          <a href={CONTACT.whatsapp} className="mt-7 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-[#0a1130]">
            <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Talk to our team</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
        <dl className="lg:col-span-7" data-reveal data-delay="1">
          <div className="border-t border-[#0a1130]/12">
            {items.map(([t, d], i) => (
              <div key={t} className="flex gap-6 border-b border-[#0a1130]/12 py-6">
                <span className="font-display text-sm tabular-nums text-[#0a1130]/30">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <dt className="font-display text-lg font-semibold text-[#0a1130]">{t}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-[#4f5468]">{d}</dd>
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

  const tiers = [
    { name: "Trial", price: "Free", unit: "14 days", desc: "Set up your school and print a sample report card. No card required.", features: ["Full feature access", "Report cards & broadsheets", "Bulk Excel import"], cta: "Start free", featured: false },
    { name: standard?.name ?? "Standard", price: standard ? ngn(standard.amount) : "—", unit: "/ year", desc: "Everything a school needs to run results end to end.", features: standard?.features ?? [], cta: "Create your school", featured: true },
    { name: pro?.name ?? "Pro", price: pro ? ngn(pro.amount) : "—", unit: "/ year", desc: "For larger schools that need branding and priority support.", features: pro?.features ?? [], cta: "Choose Pro", featured: false },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-y border-[#0a1130]/12 bg-[#F3EEE2]/50">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <div>
            <Kicker>Fees schedule</Kicker>
            <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#0a1130] sm:text-4xl">One price for your whole school.</h2>
          </div>
          <p className="max-w-xs font-sans text-[13px] leading-relaxed text-[#0a1130]/50">
            Unlimited teachers, no per-seat fees{perStudent ? ` — from about ${ngn(perStudent)} per student a year.` : "."}
          </p>
        </div>

        <div className="mt-12 grid border-t border-[#0a1130]/12 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative border-b border-[#0a1130]/12 p-8 md:border-b-0 md:border-l md:border-[#0a1130]/12 md:first:border-l-0 ${t.featured ? "bg-[#FAF7EF]" : ""}`}
              data-reveal
            >
              {t.featured ? (
                <span className="absolute right-6 top-6"><Stamp className="!rotate-[7deg] scale-[0.7]" date="Most popular" /></span>
              ) : null}
              <h3 className="font-display text-lg font-semibold text-[#0a1130]">{t.name}</h3>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-medium tabular-nums text-[#0a1130]">{t.price}</span>
                <span className="font-sans text-sm text-[#0a1130]/45">{t.unit}</span>
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#4f5468]">{t.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#0a1130]">
                    <span aria-hidden className="mt-0.5 font-display font-bold leading-none" style={{ color: VERIFY }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={t.featured ? "default" : "outline"} className={`mt-8 w-full rounded-sm ${t.featured ? "bg-[#0a1130] hover:bg-[#0a1130]/90" : "border-[#0a1130]/30 text-[#0a1130]"}`}>
                <Link href="/signup">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#0a1130]/12 pt-7 sm:flex-row" data-reveal>
          <p className="font-sans text-[14px] text-[#4f5468]">
            <span className="font-display text-[16px] font-semibold text-[#0a1130]">Running many schools?</span>{" "}
            Proprietors and groups get one console, custom subdomains and onboarding help.
          </p>
          <a href={CONTACT.whatsapp} className="inline-flex shrink-0 items-center gap-1.5 font-sans text-sm font-semibold text-[#0a1130]">
            <span className="border-b-2 pb-0.5" style={{ borderColor: VERIFY }}>Talk to us</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
        <p className="mt-6 text-center font-sans text-[12px] uppercase tracking-[0.14em] text-[#0a1130]/40">
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
      <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-[#0a1130] sm:text-4xl" data-reveal>Questions, answered.</h2>
      <div className="mt-10 border-t border-[#0a1130]/15" data-reveal>
        {FAQS.map((f, i) => (
          <details key={f.q} className="group border-b border-[#0a1130]/12 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5">
              <span className="font-display text-sm tabular-nums text-[#0a1130]/30">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-display text-[18px] font-medium text-[#0a1130]">{f.q}</span>
              <span className="font-display text-xl text-[#0a1130]/40 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-6 pl-9 pr-8 text-[15px] leading-relaxed text-[#4f5468]">{f.a}</p>
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
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg bg-[#03045E] px-8 py-16 text-white sm:px-16" data-reveal>
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
          <Button asChild size="lg" className="h-11 rounded-sm bg-white px-6 text-[#03045E] hover:bg-white/90">
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
    <footer className="border-t-[3px] border-double border-[#0a1130]/25 bg-[#FAF7EF]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#4f5468]">
            The official record of every child&apos;s term — audited, branded and
            QR-verified. Built for real classrooms.
          </p>
          <div className="mt-5 flex flex-col gap-1.5 font-sans text-sm text-[#4f5468]">
            <a href={CONTACT.whatsapp} className="inline-flex items-center gap-2 hover:text-[#0a1130]">
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
            <a href={CONTACT.email} className="inline-flex items-center gap-2 hover:text-[#0a1130]">
              <ArrowRight className="size-4" /> hello@resultprime.com
            </a>
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0a1130]/45">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-[#4f5468] hover:text-[#0a1130]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#0a1130]/12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 font-sans text-[12px] text-[#0a1130]/45 sm:flex-row">
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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#0a1130]/15 bg-[#FAF7EF]/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <Button asChild className="h-11 flex-1 rounded-sm bg-[#0a1130] hover:bg-[#0a1130]/90">
          <Link href="/signup">Create your school</Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="size-11 shrink-0 rounded-sm border-[#0a1130]/30" aria-label="Book a walkthrough on WhatsApp">
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
        background-color:#FAF7EF;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
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
