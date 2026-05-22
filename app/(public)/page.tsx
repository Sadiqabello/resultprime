import Link from "next/link";
import type { Metadata } from "next";
import {
  GraduationCap,
  Calculator,
  FileText,
  SlidersHorizontal,
  ShieldCheck,
  Upload,
  QrCode,
  ArrowRight,
  Check,
  Smartphone,
  WifiOff,
  FileSpreadsheet,
  Palette,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";

export const metadata: Metadata = {
  title: "Trusted results for primary & secondary schools",
  description:
    "RPS turns raw scores into audited, branded report cards for your whole school — configurable grading, approval workflow, broadsheets, and QR-verified results.",
};

/* ─────────────────────────────────────────────────────────────────────────
   Marketing landing page. "Modern coastal editorial" — aquatic brand palette,
   Fraunces display + Hanken Grotesk body, a report-card product mockup as the
   hero centerpiece. Original copy; structure loosely inspired by category norms.
   ───────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <StatsBand />
        <Features />
        <HowItWorks />
        <LocalContext />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-sm">
        <GraduationCap className="size-5" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-brand-950">
        RPS
      </span>
    </Link>
  );
}

function SiteNav() {
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Wordmark />
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand-900"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden px-3 text-sm font-medium text-brand-900 hover:text-brand-700 sm:block"
          >
            Sign in
          </Link>
          <Button asChild>
            <Link href="/signup">Create your school</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Atmosphere: soft brand glows + faint grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 -top-40 size-[34rem] rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -left-40 top-24 size-[28rem] rounded-full bg-brand-400/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(0 119 182 / 0.10) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 119 182 / 0.10) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span
            className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-brand-200 bg-brand-50/70 px-3 py-1 text-xs font-medium text-brand-800"
            style={{ animationDelay: "0ms" }}
          >
            <span className="size-1.5 rounded-full bg-brand-400" />
            Built for primary &amp; secondary schools
          </span>

          <h1
            className="mt-6 animate-fade-up font-display text-4xl font-semibold leading-[1.05] tracking-tight text-brand-950 sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "70ms" }}
          >
            From raw scores to{" "}
            <span className="relative whitespace-nowrap text-brand-600">
              signed report cards
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                className="absolute -bottom-1 left-0 h-3 w-full text-brand-300"
                preserveAspectRatio="none"
              >
                <path d="M2 9 C 80 2, 220 2, 298 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            in an afternoon.
          </h1>

          <p
            className="mt-6 max-w-md animate-fade-up text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "140ms" }}
          >
            RPS computes results, ranks positions, and prints branded report
            cards for your whole school — with every mark audited and every
            grading rule yours to configure.
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-wrap items-center gap-3"
            style={{ animationDelay: "210ms" }}
          >
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/signup">
                Create your school <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <p
            className="mt-5 animate-fade-up text-sm text-muted-foreground"
            style={{ animationDelay: "280ms" }}
          >
            Free to start · No card required · Live in a day
          </p>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <ReportCardMockup />
        </div>
      </div>
    </section>
  );
}

/* The memorable centerpiece: a believable mini report card with floating chips. */
function ReportCardMockup() {
  const rows = [
    { subject: "Mathematics", ca: 38, exam: 55, total: 93, grade: "A1" },
    { subject: "English Language", ca: 32, exam: 50, total: 82, grade: "A1" },
    { subject: "Basic Science", ca: 30, exam: 48, total: 78, grade: "B2" },
    { subject: "Social Studies", ca: 35, exam: 52, total: 87, grade: "A1" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* floating accent chips */}
      <div className="absolute -left-4 top-10 z-20 hidden animate-float rounded-xl border bg-card px-3 py-2 text-sm shadow-lg sm:block">
        <span className="flex items-center gap-2 font-medium text-brand-900">
          <ShieldCheck className="size-4 text-brand-500" /> Approved
        </span>
      </div>
      <div
        className="absolute -right-4 bottom-16 z-20 hidden animate-float rounded-xl border bg-card px-3 py-2 text-sm shadow-lg sm:block"
        style={{ animationDelay: "1.5s" }}
      >
        <p className="text-xs text-muted-foreground">Class position</p>
        <p className="font-display text-lg font-semibold text-brand-700">2nd of 38</p>
      </div>

      <div className="relative z-10 rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-brand-900/10 ring-1 ring-black/[0.02]">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 font-display text-sm font-semibold text-white">
              GA
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-brand-950">
                Greenfield Academy
              </p>
              <p className="text-xs text-muted-foreground">Third Term · 2025/2026</p>
            </div>
          </div>
          <span className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Report Card
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-brand-900">
          <span className="font-medium">Adaeze Okafor</span> · JSS 2 A · Adm. 0421
        </div>

        {/* table */}
        <div className="mt-4">
          <div className="grid grid-cols-[1fr_2.2rem_2.2rem_2.4rem_1.8rem] gap-1 px-1 pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Subject</span>
            <span className="text-right">CA</span>
            <span className="text-right">Exam</span>
            <span className="text-right">Total</span>
            <span className="text-right">Grade</span>
          </div>
          <div className="space-y-1">
            {rows.map((r) => (
              <div
                key={r.subject}
                className="grid grid-cols-[1fr_2.2rem_2.2rem_2.4rem_1.8rem] items-center gap-1 rounded-md px-1 py-1.5 text-xs odd:bg-muted/40"
              >
                <span className="truncate text-brand-950">{r.subject}</span>
                <span className="text-right tabular-nums text-muted-foreground">{r.ca}</span>
                <span className="text-right tabular-nums text-muted-foreground">{r.exam}</span>
                <span className="text-right font-medium tabular-nums text-brand-900">{r.total}</span>
                <span className="text-right font-semibold text-brand-600">{r.grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-display text-2xl font-semibold text-brand-950">86.4%</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <QrCode className="size-7 text-brand-800" />
            <div className="text-[10px] leading-tight text-muted-foreground">
              Scan to
              <br />
              verify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stats ──────────────────────────────────────────────────────────────── */
function StatsBand() {
  const stats = [
    { value: "5×", label: "faster than manual compilation" },
    { value: "Minutes", label: "to publish a full class" },
    { value: "100%", label: "of score changes audited" },
    { value: "1 day", label: "to go live" },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-3xl font-semibold text-brand-700 sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{children}</p>
      ) : null}
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: Calculator,
      title: "Deterministic result engine",
      desc: "Totals, averages, subject and class positions, remarks, and promotion — computed the same way every time, never by hand.",
    },
    {
      icon: FileText,
      title: "Report cards & broadsheets",
      desc: "Print-ready, branded report cards and class broadsheets, exported to PDF and Excel in one click.",
    },
    {
      icon: SlidersHorizontal,
      title: "Configurable grading",
      desc: "Your grade bands, your CA/exam weights, your position rules — set per session and level. No code, just settings.",
    },
    {
      icon: ShieldCheck,
      title: "Approvals & audit trail",
      desc: "Submit → approve → publish, with results locked on approval and every score change recorded against who and when.",
    },
    {
      icon: Upload,
      title: "Bulk Excel import",
      desc: "Teachers fill a familiar template offline; you preview every change before it's committed — and roll back a whole import if needed.",
    },
    {
      icon: QrCode,
      title: "QR-verified results",
      desc: "Each published report card carries a QR code anyone can scan to confirm it's genuine and unaltered.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 lg:py-28">
      <SectionHeading eyebrow="Everything in one place" title="The whole result cycle, handled">
        Built around a configurable result engine — every other feature exists to
        feed it clean data and turn its output into documents schools and parents
        trust.
      </SectionHeading>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-brand-950">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Set up your school",
      desc: "Sessions, terms, classes, subjects, and your grading system — guided, with sensible defaults.",
    },
    {
      n: "02",
      title: "Capture scores",
      desc: "Teachers enter marks on any device, or import them from Excel with a previewed, validated upload.",
    },
    {
      n: "03",
      title: "Compute & approve",
      desc: "Run the engine, review the broadsheet, and route results through your approval workflow.",
    },
    {
      n: "04",
      title: "Publish & print",
      desc: "Release results to parents and print branded, QR-verified report cards for the whole class.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="How it works" title="Four steps, start to finish" />
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-12 top-5 hidden h-px w-full bg-gradient-to-r from-brand-300 to-transparent lg:block"
                />
              ) : null}
              <span className="flex size-10 items-center justify-center rounded-full border border-brand-200 bg-card font-display text-sm font-semibold text-brand-600">
                {s.n}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-brand-950">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Local context ──────────────────────────────────────────────────────── */
function LocalContext() {
  const items = [
    { icon: Smartphone, title: "Phone-first", desc: "Teachers enter scores on the cheapest Android — no lab required." },
    { icon: WifiOff, title: "Low-bandwidth", desc: "Light pages and autosaved drafts survive shaky connections." },
    { icon: FileSpreadsheet, title: "Excel-friendly", desc: "Keep your spreadsheets — import them with a safety preview." },
    { icon: Palette, title: "Your brand", desc: "Your logo, colours, and signatures on every report card." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <SectionHeading eyebrow="Made for real classrooms" title="Designed for how African schools actually work">
        The most elegant system loses to the one that works on a cheap phone with
        two bars of signal. We built for that reality first.
      </SectionHeading>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-card p-6">
            <it.icon className="size-6 text-brand-500" />
            <h3 className="mt-4 font-display text-base font-semibold text-brand-950">
              {it.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────────── */
function Pricing() {
  // Pricing is driven by the same config the billing/Paystack flow charges from
  // (config/plans.ts), so the marketing page can never drift from real plans.
  const ngn = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
  const intervalLabel = (i: string) => (i === "annually" ? "/ year" : "/ term");
  const standard = PLANS.find((p) => p.key === "standard");
  const pro = PLANS.find((p) => p.key === "pro");

  const tiers = [
    {
      name: "Trial",
      price: "Free",
      unit: "14 days",
      desc: "Set up your school, import a class, and print a sample report card — no card required.",
      features: ["Full feature access", "Report cards & broadsheets", "Bulk Excel import", "Email support"],
      cta: "Start free",
      featured: false,
    },
    {
      name: standard?.name ?? "Standard",
      price: standard ? ngn(standard.amount) : "Contact us",
      unit: standard ? intervalLabel(standard.interval) : "",
      desc: "Everything a school needs to run results end to end.",
      features: standard?.features ?? [],
      cta: "Create your school",
      featured: true,
    },
    {
      name: pro?.name ?? "Pro",
      price: pro ? ngn(pro.amount) : "Contact us",
      unit: pro ? intervalLabel(pro.interval) : "",
      desc: "For larger schools that need branding and priority support.",
      features: pro?.features ?? [],
      cta: "Choose Pro",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="Pricing" title="Simple, annual pricing">
          Start free and pick a plan when you&apos;re ready. No long contracts, billed once a year.
        </SectionHeading>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                t.featured
                  ? "relative rounded-2xl border-2 border-brand-500 bg-card p-8 shadow-xl shadow-brand-900/10"
                  : "rounded-2xl border border-border bg-card p-8"
              }
            >
              {t.featured ? (
                <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="size-3 fill-current" /> Most popular
                </span>
              ) : null}
              <h3 className="font-display text-lg font-semibold text-brand-950">{t.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-brand-950">{t.price}</span>
                {t.unit ? <span className="text-sm text-muted-foreground">{t.unit}</span> : null}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-brand-900">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={t.featured ? "default" : "outline"}
                className="mt-8 w-full"
              >
                <Link href="/signup">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ (native <details>, no JS) ──────────────────────────────────────── */
function Faq() {
  const faqs = [
    {
      q: "How long does setup take?",
      a: "Most schools are live in a day. A guided checklist walks you through sessions, classes, subjects, grading, and your roster — with sensible defaults you can adjust later.",
    },
    {
      q: "Do teachers need training?",
      a: "No. Score entry works like a familiar spreadsheet, autosaves as they go, and teachers only ever see the classes assigned to them.",
    },
    {
      q: "Can I use my own grading system?",
      a: "Yes — grade bands, CA/exam weights, position and promotion rules are all configuration, set per session and level. Historical results always recompute exactly as they were.",
    },
    {
      q: "Does it work on phones and poor internet?",
      a: "It's phone-first and light. Pages stay small, score entry saves drafts, and bulk Excel import means a whole class can be captured offline and uploaded later.",
    },
    {
      q: "Can results be tampered with?",
      a: "Every score change is recorded against who made it and when, results lock on approval, and published report cards carry a QR code anyone can scan to verify authenticity.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20 lg:py-28">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between py-5 font-medium text-brand-950">
              {f.q}
              <span className="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── CTA band ───────────────────────────────────────────────────────────── */
function CtaBand() {
  return (
    <section className="px-6 pb-20 lg:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-8 py-16 text-center shadow-2xl shadow-brand-900/20 sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgb(144 224 239 / 0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgb(0 180 216 / 0.4), transparent 40%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start processing results this term.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-50/90">
            Set up your school today and turn this term&apos;s scores into report
            cards your parents can trust.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-11 px-6">
              <Link href="/signup">
                Create your school <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function SiteFooter() {
  const cols: { title: string; links: [string, string][] }[] = [
    { title: "Product", links: [["Features", "#features"], ["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"]] },
    { title: "Account", links: [["Create your school", "/signup"], ["Sign in", "/login"]] },
    { title: "Legal", links: [["Privacy", "#"], ["Terms", "#"]] },
  ];
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Multi-tenant result processing for primary &amp; secondary schools —
            configurable, audited, and built for real classrooms.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-brand-950">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-brand-700">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} RPS — Result Processing System.</p>
          <p>Made for schools.</p>
        </div>
      </div>
    </footer>
  );
}
