# RPS — Remaining Work & Go-Live Plan

> Companion to **MASTER_DEVELOPMENT_PLAN.md**. This file tracks what's **left to do**.
> The core product (Phases 0–5 + most of Phase 6) is **built and verified**. What
> remains is mostly **configuration, deployment, and operational rigor** — plus a
> short list of polish items and explicitly-deferred future features.

_Last updated: 2026-05-21_

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

### B1. CI/CD  *(not started — no `.github/workflows`)*
- [ ] GitHub Actions: on PR → `typecheck` + `lint` + `test` + `build` (+ preview deploy)
- [ ] On merge to `main` → run DB migrations, then deploy
- [ ] Dependabot + secret scanning

### B2. Test suites
- [ ] **RLS isolation tests** exist (`tests/integration/rls-isolation.test.ts`) but aren't
      run in CI — wire them against Supabase local (`RLS_TEST=1`)
- [ ] **e2e** (`tests/e2e/` is empty) — add Playwright specs for the critical journeys.
      The throwaway verification scripts written during development are a good basis:
      onboard → scores → compute → approve → publish → portal; bulk import; fee-gating.

### B3. PDF on serverless
- [ ] Add `@sparticuz/chromium` and branch in `lib/pdf/index.ts` behind a
      `process.env.VERCEL`/`AWS_LAMBDA_*` check. Move whole-class batch PDFs to a
      background job + Storage signed URL if classes are large.

### B4. Strict DB types
- [ ] `types/database.types.ts` is a permissive `any` placeholder. After migrations
      are applied to a real DB, run `npm run db:types` to generate strict types —
      this will type-check every repository against the real schema and surface any
      column drift before launch.

### B5. Monitoring & observability  *(not wired)*
- [ ] **Sentry** (app + edge) for errors; **PostHog** (privacy-aware) for onboarding funnels
- [ ] Ship structured logs (`lib/logger`) to a platform (Logflare/Axiom/Datadog)
- [ ] Uptime ping on `/api/health`

### B6. Security review
- [ ] Tighten **CSP** if you remove inline scripts/styles (currently allows `'unsafe-inline'`;
      `'unsafe-eval'` only in dev — already conditional)
- [ ] Manual pen-test of auth/tenancy/file-access before scaling; confirm the
      service-role key never reaches the client bundle

---

## C. Account-provisioning polish (tied to email)

### C1. Real invite / password setup for students & parents
Today `/students/[id]` provisions student/parent logins via a **confirmed account
with a random temp password** (so it works without email). Once Auth SMTP is set
(A1), switch the experience to a proper flow so families can actually sign in:
- [ ] Send an **invite / set-password email** on login creation (or surface a
      "send password reset" action), instead of the silent temp password
- [ ] Optional: bulk-invite parents/students; magic-link sign-in for low digital literacy

---

## D. Tech-debt / cleanup (low effort, no user impact)

- [ ] Remove or implement the unused **`components/data-table/data-table.tsx`** stub
      (lists are currently bespoke)
- [ ] Remove the unused **`lib/authz` scope-check stub signatures**
      (`isAssignedToClassSubject`, `isFormTeacherOf`) — enforcement is already inline + RLS
- [ ] Replace the **placeholder pricing copy** on the marketing page (`app/(public)/page.tsx`)
      with real plans (or pull from `config/plans.ts`)

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

1. **B4** (generate strict types) → catches schema drift early, cheap.
2. **A2 + A3 + B3** (prod DB, deploy, PDF-on-serverless) → app runs in prod.
3. **A1 + A4 + A5** (keys, subdomains, cron) → fully functional for a pilot school.
4. **C1** (invite emails) → parents/students can self-serve sign-in.
5. **B1 + B2** (CI + e2e/RLS tests) → safe to iterate at speed.
6. **B5** (monitoring) before onboarding many schools.
7. **D** cleanup whenever; **E** as the roadmap demands.

> **Definition of "launch-ready":** A through C complete + B1/B2/B5 in place. After
> that, a pilot school can run a full term end-to-end and families can view results,
> with errors monitored and isolation continuously tested.
