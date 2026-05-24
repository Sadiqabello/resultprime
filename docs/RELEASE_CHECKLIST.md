# Go-Live Checklist & Smoke Test

A single, ordered runbook to host Result Prime safely. Code is in place; these are
the deploy/provider steps + the manual test that substitutes for (still-missing) e2e.

> Companion to `REMAINING_WORK.md`. Tick these before pointing real schools at it.

---

## 1. Provider secrets (set in the host's secret store — never in the repo)

Env var names are **case-sensitive** — copy from `.env.example` exactly.

| Var | Required? | Notes |
|-----|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Prod project (not dev). |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only. Never in client bundle. |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` | ✅ | e.g. `https://app.yourdomain.com`, `yourdomain.com`. |
| `CRON_SECRET` | ✅ | ≥16 random chars. |
| `RESEND_API_KEY`, `EMAIL_FROM` | ✅ for email | **Both** required or email silently no-ops. `EMAIL_FROM` must be a verified Resend sender. |
| `PAYSTACK_SECRET_KEY` | ✅ for billing | `sk_live_…`. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | ✅ on serverless / multi-instance | In-memory limiter is per-instance otherwise (weakens brute-force + abuse limits). The app logs a warning if missing in prod. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | optional | WhatsApp/SMS. |
| `SENTRY_DSN` | recommended | Set + `npm i @sentry/nextjs`; errors auto-forward via `lib/logger#captureException`. |

---

## 2. Database

- [ ] Create a **separate prod Supabase project** (don't reuse dev).
- [ ] Apply **all** migrations — they're load-bearing (publish + webhook break without the latest):
      ```bash
      supabase link --project-ref <prod-ref>
      supabase db push          # applies supabase/migrations/* (00 … 17)
      ```
- [ ] Seed roles/permissions + a super admin:
      ```bash
      psql "$PROD_DB_URL" -f supabase/seed.sql      # or via Studio SQL editor
      npm run seed:superadmin
      ```
- [ ] Enable **PITR / daily backups**; schedule a quarterly restore drill.
- [ ] Confirm the **`rls` CI job is green** on the commit you deploy (it applies the
      migrations to a real Postgres + proves tenant isolation — your migration smoke test).

## 3. Supabase Auth settings (easy to miss — breaks logins)

- [ ] **Site URL** = `https://app.yourdomain.com`.
- [ ] **Redirect allowlist** includes the app URL **and** `https://*.yourdomain.com/**`
      (subdomain-per-school) — otherwise `/auth/confirm` recovery + password-setup links fail.
- [ ] Configure **Auth SMTP** (Auth → SMTP) — required for staff *invites*.

## 4. Hosting / deploy

- [ ] Deploy the Next.js app (Vercel or container).
- [ ] **PDF rendering needs Chrome:** serverless installs `@sparticuz/chromium`
      (optional dep) via `npm ci` on the target; container → install Chrome or set
      `PUPPETEER_EXECUTABLE_PATH`. Report cards fail without it.
- [ ] Wildcard DNS `*.yourdomain.com` → the deployment.
- [ ] Verify the service-role key is **not** in any client chunk:
      ```bash
      npm run build && ! grep -rl "$SUPABASE_SERVICE_ROLE_KEY" .next/static 2>/dev/null && echo "clean"
      ```

## 5. Providers / scheduled jobs

- [ ] Paystack dashboard → webhook URL `https://<app>/api/webhooks/payments`.
- [ ] Confirm checkout returns to `https://<app>/subscription/callback` (set in code).
- [ ] Schedule cron (host cron / Supabase pg_cron / scheduled function), POST with
      `Authorization: Bearer <CRON_SECRET>`:
  - [ ] `POST /api/cron/notifications` every ~2–5 min (flush email/WhatsApp queue)
  - [ ] `POST /api/cron/billing` daily (dunning reminders)
  - [ ] `POST /api/cron/recompute` nightly (optional)

## 6. Legal / compliance

- [ ] Complete `/privacy` and `/terms` with counsel (NDPR for Nigerian schools);
      replace the `yourdomain.com` placeholders and the "template" notices.

---

## 7. Post-deploy smoke test (run on staging, then prod)

No e2e suite yet — walk the full critical path manually. Each line should succeed end-to-end.

**Onboarding & config**
- [ ] Sign up a school → admin lands in dashboard.
- [ ] Create a session + term (set current), a class, subjects, assign a teacher.
- [ ] Configure a grading system (bands) + assessment scheme (components) — totals to 100.
- [ ] Add a few students; enrol them in the class for the term.

**Scores → results → publish**
- [ ] Teacher enters scores for a subject; save.
- [ ] Bulk-import scores from the downloaded template (try a name starting with `=` → opens as text, not a formula).
- [ ] Compute the class → broadsheet shows totals/averages/positions.
- [ ] Submit → score sheets lock (editing is refused).
- [ ] Approve → Publish → confirm it's atomic (results become visible; no half state).
- [ ] Re-open (Return) → scores editable again.

**Consumer + documents**
- [ ] Parent/student account: set password via the emailed link (`/auth/confirm` → `/update-password`).
- [ ] Portal shows only this child's **published** results — and nothing from another school.
- [ ] Download a single report-card PDF and a whole-class merged PDF.
- [ ] Toggle fee-gating on + mark a student "owing" → their results are hidden in the portal until "cleared".

**Billing**
- [ ] Start checkout → pay (Paystack test card) → land on `/subscription/callback` (not a 404) → subscription active.
- [ ] Re-send the same webhook → no double-extension of the period (idempotent).
- [ ] Let a trial lapse (or set dates) → access goes read-only in grace, then locked; renew restores it.

**Isolation & ops**
- [ ] As School A, confirm you cannot see School B's students/results anywhere.
- [ ] `GET /api/health` returns 200 → point your uptime monitor at it.
- [ ] Trigger an error and confirm it reaches your log platform / Sentry.
