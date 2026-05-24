# RPS — Remaining Work & Go-Live Plan

> Companion to **MASTER_DEVELOPMENT_PLAN.md**. This file tracks what's **left to do**.
> The core product (Phases 0–5 + most of Phase 6) is **built and verified**. What
> remains is mostly **configuration, deployment, and operational rigor** — plus a
> short list of polish items and explicitly-deferred future features.

_Last updated: 2026-05-24_

---

## 0. Status snapshot (what's already done)

Built **and runtime-verified** across the codebase:

- Tenancy · Auth · RBAC · **RLS** (tenant isolation enforced in Postgres)
- Academic structure · People · Grading config · Score entry
- **Result engine** (pure, golden-master + property tested) · Approval workflow · Locking
- **Bulk score import** (Excel) · **Report-card PDF** (single + batch) · Broadsheet
- **Branding/settings** · **Remarks + attendance** · **Affective/psychomotor traits** · **Signature images**
- **In-app notifications** + **email/WhatsApp delivery** (transports + cron worker)
- **Cumulative/annual results** + **promotion** + **bulk promotion**
- **Bursary fee-gating** · **Parent/student portal** · **Subdomain resolution + per-tenant theming**
- **Billing/Paystack** (checkout + webhook + subscriptions)
- **Edit student/staff** · **Storage uploads** · **Whole-school recompute cron** · **Rate limiting** · **CSP/HSTS**

Everything below is **not yet done**.

### Recent hardening (2026-05-24)

Migrations `14`–`17` + app changes from a full-codebase review:

- **RLS**: added the missing `school_id = current_school_id()` tenant predicate to
  the consumer self-read policies on `results` / `term_results` / `cumulative_results`.
- **Atomic publish**: `apply_approval_transition()` RPC does the approval row +
  event log + result-visibility flips in one transaction (no half-applied state).
- **Payments**: webhook is now idempotent (dedupes on the Paystack reference via a
  new `payment_events` table) and returns non-2xx on real failures so Paystack retries.
- **Integrity**: `cumulative_results` natural key is a full unique index (race-free
  upsert); `assessment_components.max_score > 0` check; `fee_status.term_id` kept
  consistent with the enrollment via trigger.
- **Engine**: term average is now a true percentage of obtainable marks.
- **Misc**: swallowed-error server actions now surface failures; constant-time cron
  auth; rate-limited PDF/compute/import; XLSX formula-injection guard; strict DB
  types; `onRequestError` error sink; batched class compute.

---

## A. Go-live blockers (must do to ship)

These are the things that stop a real school from using the system in production.
None are code features — they are **secrets, providers, and deployment**.

### A1. Provider keys / secrets
Set these in the host's secret store (never in the repo). The code already reads
them and falls back to safe stubs when absent.

| Purpose | Env vars | Notes |
|---|---|---|
| Payments (Paystack) | `PAYSTACK_SECRET_KEY` | `sk_live_…`. Enables checkout + webhook verification. |
| Transactional email | `RESEND_API_KEY`, `EMAIL_FROM` | For result-published emails. `EMAIL_FROM` must be a verified domain. |
| WhatsApp / SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | For result-published WhatsApp. |
| Shared rate-limit (multi-instance) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional; in-memory limiter works on a single instance. |
| Already required | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `CRON_SECRET` | Validated in `config/env.ts`. |

- [ ] Paystack key set; webhook in the Paystack dashboard → `https://<app>/api/webhooks/payments`
- [ ] Resend key + verified sender domain set
- [ ] Twilio WhatsApp credentials set (if WhatsApp is in scope for launch)
- [ ] **Supabase Auth SMTP configured** (project → Auth → SMTP) — required for staff
      invites and parent/student password setup (see C1)
- [ ] Optional: Upstash keys for shared rate limiting

### A2. Production database
- [ ] Create a **separate** Supabase project for production (don't reuse the dev project)
- [ ] Apply **all** migrations to it. The files live in `supabase/migrations/` (00–13).
      Several were applied to dev via the SQL editor — make the history authoritative:
      ```bash
      supabase link --project-ref <prod-ref>
      supabase db push          # applies every supabase/migrations/* in order
      npm run db:types          # regenerate strict types (see B4)
      ```
- [ ] Seed system roles/permissions + a Super Admin: `supabase/seed.sql` then `npm run seed:superadmin`
- [ ] Enable **PITR** + verify daily backups; schedule a quarterly restore drill (§9.8)

### A3. Hosting / deploy
- [ ] Deploy the Next.js app (Vercel or a container host)
- [ ] **PDF rendering needs Chrome.** On Vercel/Lambda there is none — wire
      `@sparticuz/chromium` at the documented seam in `lib/pdf/index.ts`
      (`resolveExecutablePath`). On a container, install Chrome or set
      `PUPPETEER_EXECUTABLE_PATH`. (See B3.)
- [ ] Set all env vars per environment (staging + prod)
- [ ] Point a domain at the deployment

### A4. Subdomains (per-school URLs)
The resolution + theming + tenant-mismatch guard are built; they just need DNS + config.
- [ ] Wildcard DNS `*.yourdomain.com` → the deployment
- [ ] Set `NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com` and `NEXT_PUBLIC_APP_URL=https://app.yourdomain.com`
- [ ] (Enterprise, optional) custom domains per school (Vercel custom domains / Cloudflare for SaaS)

### A5. Scheduled jobs (cron)
Both endpoints are built and `CRON_SECRET`-protected — they just need a scheduler
(Supabase `pg_cron` / scheduled Edge Function / host cron) sending `POST` with
`Authorization: Bearer <CRON_SECRET>`.
- [ ] `POST /api/cron/notifications` every ~2–5 min (flush email/WhatsApp queue)
- [ ] `POST /api/cron/recompute` nightly (refresh computed results) — optional

---

## B. Pre-launch hardening

### B1. CI/CD
- [x] **GitHub Actions** (`.github/workflows/ci.yml`): on PR/push → `typecheck` +
      `lint` + `test` + `build`. Build/test run with dummy env so `config/env.ts`
      validation passes (CI never reaches a real Supabase project). All four steps
      verified green locally.
- [x] **Dependabot** (`.github/dependabot.yml`): weekly npm (grouped) + actions.
- [ ] On merge to `main` → run DB migrations, then deploy *(needs host + deploy
      secrets — wire once A2/A3 are set up; add a `deploy` job gated on `main`)*
- [ ] Enable **secret scanning** + push protection in the repo's GitHub settings
      (UI toggle, not a file)
- [ ] Optional: preview deploys on PR (Vercel GitHub app, once hosting is chosen)

### B2. Test suites
- [x] **RLS isolation tests** run in CI: a dedicated `rls` job boots Supabase
      (`supabase start`), applies migrations + seed, and runs the suite with
      `RLS_TEST=1` (`npm run test:rls`, `vitest.integration.config.ts`).
- [x] **Property-based engine tests** (`tests/unit/result-engine.properties.test.ts`,
      fast-check): ranking order/no-gaps, grade-band coverage, rounding, term-average
      invariants — run in the normal unit suite.
- [ ] **e2e** (`tests/e2e/` is empty) — add Playwright specs for the critical journeys.
      The throwaway verification scripts written during development are a good basis:
      onboard → scores → compute → approve → publish → portal; bulk import; fee-gating.

### B3. PDF on serverless
- [x] **Wired.** `lib/pdf/index.ts` now branches on `process.env.VERCEL` /
      `AWS_LAMBDA_FUNCTION_NAME` / `AWS_EXECUTION_ENV` and lazy-loads
      `@sparticuz/chromium` (a `webpackIgnore` dynamic import + `optionalDependencies`
      + ambient type in `types/chromium.d.ts`, so local/CI builds never need the
      package present). `next build` verified to pass without it installed.
      - **On deploy:** `npm ci` installs the optional dep on the serverless target.
        Keep its version in step with `puppeteer-core`'s bundled Chrome
        (currently pinned `^131.0.0`); bump together when you upgrade puppeteer.
- [ ] Still TODO: move whole-class **batch** PDFs to a background job + Storage
      signed URL for large classes (single + small batches render in-request fine).
      Interim guard in place: the PDF routes are now **rate-limited per user**
      (`pdf:report` 20/min, `pdf:class` 6/min) so concurrent exports can't exhaust
      memory; `compute` and `import` actions are rate-limited too.

### B4. Strict DB types
- [x] `types/database.types.ts` now holds strict, hand-maintained types
      transcribed from `supabase/migrations/*` — every repository is type-checked
      against the real schema (it already surfaced a real bug: writing
      non-existent `created_by`/`updated_by` to `classes`). Regenerate the
      canonical version with `npm run db:types` when the schema changes (drop-in
      compatible). The `rls` CI job runs against a real Postgres so schema drift
      surfaces there too.

### B5. Monitoring & observability  *(error sink wired; tracker SDK pending)*
- [x] **Error sink wired**: Next's `onRequestError` (instrumentation.ts) funnels
      uncaught server errors through `lib/logger#captureException`, the single
      swappable place to forward to a tracker.
- [ ] **Sentry** (app + edge): add the SDK + `SENTRY_DSN` and forward from
      `captureException`. **PostHog** (privacy-aware) for onboarding funnels.
- [ ] Ship structured logs (`lib/logger`) to a platform (Logflare/Axiom/Datadog)
- [x] Uptime ping endpoint exists: `GET /api/health` (cheap, unauthenticated,
      whitelisted in middleware). Just point your uptime monitor at it.

### B6. Security review
- [ ] Tighten **CSP** if you remove inline scripts/styles (currently allows `'unsafe-inline'`;
      `'unsafe-eval'` only in dev — already conditional)
- [ ] Manual pen-test of auth/tenancy/file-access before scaling; confirm the
      service-role key never reaches the client bundle

---

## C. Account-provisioning polish (tied to email)

### C1. Real invite / password setup for students & parents
- [x] **Built.** Creating a student/parent login now emails a **password-setup
      link** automatically. The flow:
      - `authRepository.generateRecoveryToken()` mints a recovery OTP via
        `admin.generateLink` (does **not** use Supabase's own mailer).
      - `sendAccountSetupEmail()` (modules/auth/service) emails the link through
        **our own transport** (`lib/delivery`) — Resend when `RESEND_API_KEY` +
        `EMAIL_FROM` are set, else the dev **log transport** prints the link so
        the flow is completable locally without paid keys.
      - The link hits `GET /auth/confirm` (public route → `verifyOtp` sets the
        session) and lands on `/update-password`, which calls
        `supabase.auth.updateUser({ password })` and routes by role.
      - The UI now reports "setup email sent" vs "set RESEND_API_KEY…" so admins
        know whether a real email went out.
      - **Note:** this path uses our transport, so it works *without* Supabase
        Auth SMTP. Set `RESEND_API_KEY` + a verified `EMAIL_FROM` (A1) to send
        real emails; Supabase Auth SMTP is still needed for staff *invites*.
- [ ] Optional: bulk-invite parents/students; magic-link sign-in for low digital
      literacy; a "resend setup link" button (the `sendAccountSetupEmail` helper
      makes this a small add).

---

## D. Tech-debt / cleanup (low effort, no user impact)

- [x] Removed the unused **`components/data-table/`** stub (lists are bespoke).
- [x] Removed the unused **`lib/authz` `ScopeChecks` stub** — enforcement is
      already inline + RLS.
- [x] Marketing pricing (`app/(public)/page.tsx`) is now **derived from
      `config/plans.ts`** (Trial + the real Standard/Pro plans), so it can't drift
      from what billing actually charges.

---

## E. Deferred / future (Phase 6 — optional, by design)

Per MASTER plan §2.3/§2.4 these were intentionally **not** built; pick up as the
business needs them:

- [ ] **Configurable report-card templates** (the plan ships fixed templates first; one solid template exists)
- [ ] **CA analytics & dashboards** (subject trends, at-risk students)
- [ ] **Public `/v1` API** for integrations (versioned, API-key auth, OpenAPI)
- [ ] **Multi-language UI** (per-tenant locale)
- [ ] **Government / board reporting exports**
- [ ] **CBT / online exams** module
- [ ] **Native mobile app** (the PWA covers most needs)
- [ ] **Reseller / white-label** program

---

## Suggested sequence

1. ~~**B4** (strict types)~~ ✅ done. ~~**B2** RLS-in-CI~~ ✅ done.
2. **A2 + A3 + B3** (prod DB, deploy, PDF-on-serverless) → app runs in prod.
3. **A1 + A4 + A5** (keys, subdomains, cron) → fully functional for a pilot school.
4. **C1** (invite emails) → parents/students can self-serve sign-in.
5. **B1 + B2** (CI + e2e/RLS tests) → safe to iterate at speed.
6. **B5** (monitoring) before onboarding many schools.
7. **D** cleanup whenever; **E** as the roadmap demands.

> **Definition of "launch-ready":** A through C complete + B1/B2/B5 in place. After
> that, a pilot school can run a full term end-to-end and families can view results,
> with errors monitored and isolation continuously tested.
