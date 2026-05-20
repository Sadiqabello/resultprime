# Result Processing System (RPS) — Master Development Plan

> **A multi-tenant SaaS platform for Primary & Secondary Schools**
> Stack: Next.js (App Router) · TypeScript · shadcn/ui · Tailwind CSS · Supabase (PostgreSQL / Auth / Storage)
> Document status: Architecture Blueprint v1.0 · Audience: Founder/CTO, engineering, and product

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [System Scope](#2-system-scope)
3. [User Roles & Permissions (RBAC)](#3-user-roles--permissions-rbac)
4. [Multi-Tenant SaaS Architecture](#4-multi-tenant-saas-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Result Engine Design](#6-result-engine-design)
7. [Application Architecture (Next.js)](#7-application-architecture-nextjs)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Security Architecture](#9-security-architecture)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Report Card & PDF Generation](#11-report-card--pdf-generation)
12. [Bulk Import System](#12-bulk-import-system)
13. [Audit & Logging System](#13-audit--logging-system)
14. [API & Backend Strategy](#14-api--backend-strategy)
15. [Performance & Scalability](#15-performance--scalability)
16. [Deployment & DevOps](#16-deployment--devops)
17. [Development Roadmap](#17-development-roadmap)
18. [MVP Implementation Plan](#18-mvp-implementation-plan)
19. [Team Structure](#19-team-structure)
20. [Testing Strategy](#20-testing-strategy)
21. [Common Mistakes to Avoid](#21-common-mistakes-to-avoid)
22. [Final Recommendations](#22-final-recommendations)

---

## 1. Product Vision

### 1.1 What the platform is

RPS is a **cloud-hosted, multi-tenant SaaS** that replaces the manual, error-prone, spreadsheet-and-paper process by which African primary and secondary schools compute and publish student results. A school signs up, configures its academic structure (sessions, terms, classes, subjects, grading scale), onboards staff and students, and from then on teachers enter scores, the system computes results deterministically, administrators approve them through a controlled workflow, and the platform produces print-ready report cards and broadsheets — with a full audit trail behind every number.

The product is **not** a generic CRUD admin panel. The center of gravity is the **Result Engine**: a configurable computation layer that turns raw scores into grades, totals, averages, positions, remarks, and promotion decisions according to each school's own rules. Everything else (student management, staff management, PDF generation) exists to feed and surface that engine.

### 1.2 Business goals

| Goal | Description | Why it matters |
|------|-------------|----------------|
| Recurring revenue | Per-school subscription (annual or per-term), tiered by student count and features | Predictable SaaS economics; schools budget per session |
| Low onboarding friction | A school must be live within one working day | Schools have short windows (start of term); slow onboarding kills deals |
| High retention | Once a school's historical results live here, switching cost is high | Education software is sticky if data and trust accumulate |
| Operational leverage | One codebase serves thousands of schools | Marginal cost per new school approaches zero |
| Trust & compliance | Results are high-stakes records (admissions, scholarships) | A single wrong result destroys credibility; correctness is the moat |

### 1.3 Target users

- **Primary buyer / champion:** School proprietor, principal, or IT-savvy administrator who feels the pain of manual result compilation.
- **Daily power users:** Exam officers and form/class teachers who enter and reconcile scores under deadline pressure.
- **Occasional users:** Subject teachers (score entry windows only), principals/vice-principals (approval), bursars (fee-gating of results).
- **Consumers:** Parents and students who view or download approved results.

> **African context note:** Many schools have intermittent power and bandwidth, mixed device quality (low-end Android phones, shared desktops in an office), and staff with low digital literacy. The product must degrade gracefully on poor networks, work well on phones, tolerate interrupted sessions, and present an interface a non-technical teacher can use without training. Offline-tolerant score entry and bulk Excel import are not luxuries here — they are core to adoption.

### 1.4 Core value proposition

1. **Eliminate compute errors.** Manual broadsheet math (totals, averages, positions across hundreds of students × dozens of subjects) is where schools lose credibility. RPS makes that deterministic and auditable.
2. **Collapse time-to-result.** What took a deputy two weeks of evenings becomes hours.
3. **Configurable to each school's rules**, not a rigid template — different grading scales, CA/exam weightings, position rules, promotion policies.
4. **Professional, branded report cards** that improve the school's perceived quality to fee-paying parents.
5. **A permanent, verifiable record** — historical results, QR-verifiable report cards, audit trails for disputes.

### 1.5 Competitive advantage

| Lever | How RPS wins |
|-------|--------------|
| **Configurability** | Most local tools hard-code one grading system. RPS treats grading, weighting, position rules, and remarks as per-school data, not code. |
| **Result correctness & auditability** | Append-only score history + deterministic, re-runnable engine + approval workflow. Disputes resolve in seconds. |
| **Multi-tenant ops** | Schools self-serve; you scale support, not servers. |
| **Localized UX** | Phone-first, low-bandwidth, Excel-friendly, offline-tolerant — fits real African school operations. |
| **Trust features** | QR verification + watermarking + tamper-evident records become a selling point to parents and exam boards. |

---

## 2. System Scope

A disciplined scope is the single biggest predictor of whether this ships. The temptation is to build "everything a school needs" (fees, CBT, attendance biometrics, LMS, payroll). **Resist it.** Win the result-processing job completely first.

### 2.1 MVP scope (must ship to be useful)

The MVP must let one school go from raw scores to an approved, printable report card.

- **Tenant & onboarding:** create school, configure session/term, school profile + logo.
- **Identity & RBAC:** Super Admin, School Admin, Exam Officer, Teacher, Form Teacher (minimum viable role set).
- **Academic structure:** sessions, terms, classes (+ arms/streams), subjects, class-subject-teacher assignment.
- **People:** students (with enrollment into a class for a session/term), staff.
- **Grading configuration:** grade bands (A/B/C…), CA + Exam component definition with weights.
- **Score entry:** per class-subject, per term; validation; save-as-draft; bulk Excel import.
- **Result engine v1:** totals, averages, grade mapping, subject position, class position, remarks, term aggregate.
- **Approval workflow v1:** draft → submitted → approved → published; result locking.
- **Report card PDF (single + batch)** and **broadsheet PDF/Excel export**.
- **Audit log** of score changes and approvals.
- **Parent/student read-only result view** (can be a simple authenticated portal or token link).

### 2.2 Phase 2 (deepen the wedge)

- Cumulative/annual results (combine all three terms; annual position; promotion engine).
- Attendance integration into report cards.
- Configurable report-card templates (per school) + signatures + QR verification.
- Affective/psychomotor traits and behavioral ratings (very common on African report cards).
- Bursary fee-gating (block result release for students owing fees).
- Notifications (email/SMS/WhatsApp) when results publish.
- Parent portal with multiple children, historical results.
- Subdomain-per-school + custom branding.
- Bulk student promotion between sessions.

### 2.3 Future / enterprise features

- Self-serve billing & subscription management (Paystack/Flutterwave/Stripe).
- Continuous Assessment analytics & dashboards (subject performance trends, at-risk students).
- CBT/online exams module.
- Mobile app (React Native) for teachers/parents.
- Government/board reporting exports.
- White-label reseller program (an "education consultant" manages many schools).
- API for integrations (school management systems, payment, biometrics).
- Multi-language UI; configurable per tenant.

### 2.4 What should NOT be built initially (and why)

| Don't build yet | Why |
|-----------------|-----|
| Full fee/accounting module | Huge domain of its own; only the "result gate" slice matters early. |
| LMS / e-learning / CBT | Different product; dilutes focus and onboarding. |
| Custom report-card drag-and-drop designer | Build 2–3 solid fixed templates first; designer is a deep time sink. |
| Native mobile apps | Responsive PWA covers 95% of need at a fraction of cost. |
| Real-time collaborative score entry | Optimistic save + locking is enough; CRDT/realtime is over-engineering. |
| Per-tenant custom code/plugins | Configurability via data, never via bespoke code per school. |
| Microservices | A well-structured modular monolith on Next.js + Supabase is correct at this stage. |

> **Principle:** Configurability beats features. Ship fewer features that bend to every school's rules, not more features that fit none.

---

## 3. User Roles & Permissions (RBAC)

### 3.1 RBAC model

RPS uses **role-based access control scoped to a tenant**, with a thin layer of **resource scoping** (a teacher only sees the classes/subjects assigned to them). The model has three dimensions:

```
                 ┌─────────────────────────────────────────┐
   WHO (role)    │  permission = (role) × (action) × (scope)│   ON WHAT (scope)
                 └─────────────────────────────────────────┘
   Super Admin        create/read/update/delete/approve         platform / school /
   School Admin        /submit/lock/publish/export                class / subject /
   Teacher        ──────────────────────────────────────►        student / self
```

- **Roles** are stored in the DB (`roles`) and **permissions** are explicit (`permissions` + `role_permissions`) so you can introduce custom roles per school later without code changes.
- **Scope** narrows a role's reach: an Exam Officer acts school-wide; a subject Teacher acts only on `class_subject` rows assigned to them; a Form Teacher acts on their class.
- The **JWT carries `school_id` + `role`**; RLS enforces tenant isolation in the database; the application service layer enforces the finer scope (assignment-based).

> **Design rule:** Never trust the role alone. A "Teacher" role + an *assignment check* ("is this teacher assigned to this class_subject for this term?") together gate every score mutation. Roles authorize *capabilities*; assignments authorize *targets*.

### 3.2 Role-by-role specification

Legend for permissions: **C**reate · **R**ead · **U**pdate · **D**elete(soft) · **Submit** · **Approve** · **Publish** · **Lock/Unlock** · **Export**.

#### Super Admin (platform operator — you)
- **Permissions:** Full platform control. Create/suspend schools, manage subscriptions, impersonate (with audit) for support, view platform-wide health, manage global grading templates, manage system roles/permissions.
- **Restrictions:** Should **not** silently edit a school's academic data; any cross-tenant action is logged and ideally requires "support mode" with explicit reason.
- **Workflow:** Onboard school → provision School Admin → monitor usage/billing → support escalations.
- **Access boundary:** Cross-tenant by design; everything audited.

#### School Admin (school owner/proprietor/IT admin)
- **Permissions (within own school only):** Configure school profile/branding, sessions/terms, classes/subjects, grading systems, report templates; manage all users in the school; assign roles; assign teachers to class-subjects; view all results; export everything; configure approval policy.
- **Restrictions:** Cannot see other schools. Typically cannot itself *approve* results if you separate "admin" from "principal" duties (configurable). Cannot delete published results — only authorized correction workflow.
- **Workflow:** Initial setup → onboard staff/students → delegate → oversee term cycle.
- **Access boundary:** Own tenant, all data.

#### Principal
- **Permissions:** Read all results school-wide; **Approve/Publish** results; sign report cards (digital signature); view broadsheets, analytics; comment/remark at student level (head teacher's remark).
- **Restrictions:** Usually not entering raw scores; cannot edit a locked/approved score directly — must trigger a correction workflow.
- **Workflow:** Receive submitted results from Exam Officer → review broadsheet → approve or send back with notes → publish.
- **Access boundary:** Own tenant, read-wide, approval authority.

#### Vice Principal
- **Permissions:** Same read scope as Principal; **first-level approval** (configurable two-step approval: VP reviews → Principal approves); may be scoped to a section (e.g., Junior vs Senior secondary).
- **Restrictions:** Final publish reserved for Principal unless configured otherwise.
- **Workflow:** Pre-screen submitted results, flag anomalies, forward to Principal.
- **Access boundary:** Own tenant; optionally section-scoped.

#### Exam Officer (the operational hub)
- **Permissions:** Manage assessment windows; open/close score entry; **chase, validate, and submit** results; run the engine (recompute); generate broadsheets; bulk import scores; manage grading config (often delegated here); lock results before approval.
- **Restrictions:** Cannot give final approval/publish (separation of duties); cannot change a published result without correction workflow.
- **Workflow:** Open entry window → monitor completion per class-subject → validate (no missing/invalid scores) → lock → submit for approval.
- **Access boundary:** Own tenant, school-wide on assessment/result operations.

#### Teacher (subject teacher)
- **Permissions:** Enter/edit scores **only for class-subjects assigned to them**, **only while the entry window is open and the result is not locked**; view their own students' scores; save draft; submit their portion.
- **Restrictions:** No access to other teachers' subjects; cannot see overall student positions until published (configurable); cannot approve; cannot export school-wide broadsheets.
- **Workflow:** Open assigned class-subject → enter CA + exam → validate → submit. Bulk paste/upload supported.
- **Access boundary:** `class_subject` rows where `teacher_id = self` for the active term.

#### Form Teacher / Class Teacher
- **Permissions:** Everything a Teacher has for their own subjects, **plus** class-level oversight of *their* class: see the class broadsheet, enter the **class teacher's remark / behavioral traits / attendance**, verify all subjects are complete before class submission.
- **Restrictions:** Cannot edit *other teachers'* subject scores (can flag/return); cannot approve.
- **Workflow:** Monitor that all subject teachers submitted → fill attendance + remarks/traits → submit class to Exam Officer.
- **Access boundary:** Own assigned class (all students in it) + own subjects.

#### Student
- **Permissions:** View/download **own approved & published** results and report cards; view own profile.
- **Restrictions:** Read-only; never sees other students; never sees draft/unpublished results; cannot see class positions of others.
- **Workflow:** Log in (or open tokenized link) → view current + historical results → download PDF.
- **Access boundary:** `student_id = self`, published results only.

#### Parent / Guardian
- **Permissions:** View/download approved results for **linked children** (one parent → many students, across classes); receive notifications; view fee/result-gate status.
- **Restrictions:** Read-only; only linked children; fee-gated if school enables it.
- **Workflow:** Log in → select child → view/download.
- **Access boundary:** Students linked via `student_guardians` where `guardian_id = self`, published only.

#### Bursary (accounts officer)
- **Permissions:** Manage fee status per student (paid/owing) **for the purpose of result gating**; mark a student as cleared/blocked; view (not edit) results; export fee-vs-result reports.
- **Restrictions:** No academic edit rights; cannot approve academics.
- **Workflow:** Update payment status → cleared students' results become downloadable to parents.
- **Access boundary:** Own tenant; fee/clearance fields only.

### 3.3 Permission matrix (condensed)

| Capability | Super | Sch.Admin | Principal | VP | Exam Off. | Teacher | Form T. | Student | Parent | Bursar |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Manage schools (platform) | ✅ | — | — | — | — | — | — | — | — | — |
| Configure school/session/grading | — | ✅ | ◇ | — | ✅* | — | — | — | — | — |
| Manage users/roles (school) | — | ✅ | — | — | — | — | — | — | — | — |
| Assign teachers to subjects | — | ✅ | — | — | ✅ | — | — | — | — | — |
| Enter/edit scores | — | — | — | — | ◇ | ✅(own) | ✅(own) | — | — | — |
| Class remarks / attendance / traits | — | — | — | — | — | — | ✅ | — | — | — |
| Submit results | — | — | — | — | ✅ | ✅(own) | ✅(class) | — | — | — |
| Approve results | — | ◇ | ✅ | ✅(L1) | — | — | — | — | — | — |
| Publish results | — | ◇ | ✅ | — | — | — | — | — | — | — |
| Lock/unlock results | — | ✅ | ✅ | — | ✅ | — | — | — | — | — |
| View school-wide broadsheet | — | ✅ | ✅ | ✅ | ✅ | — | ◇(class) | — | — | ◇(read) |
| Manage fee/result gate | — | ◇ | — | — | — | — | — | — | — | ✅ |
| View own results | — | — | — | — | — | — | — | ✅ | ✅ | — |

✅ = allowed · ◇ = configurable/delegated · ✅* = if delegated · — = denied

> **Implementation note:** Store this matrix as `role_permissions` rows, not as `if (role === 'teacher')` checks scattered through code. A single `can(user, action, resource)` authorization service reads the matrix + assignment scope. This is what lets you add "Head of Department" or "Form Teacher Assistant" later without touching the codebase.

---

## 4. Multi-Tenant SaaS Architecture

### 4.1 Tenant isolation strategy — the decision and the why

There are three classic models:

| Model | Isolation | Cost/Ops | Best for |
|------|-----------|----------|----------|
| Database-per-tenant | Strongest | Expensive, hard to migrate/scale to thousands | Few, large, regulated tenants |
| Schema-per-tenant | Strong | Migrations × N schemas; Postgres strains past ~hundreds of schemas | Dozens–low hundreds of tenants |
| **Shared DB, shared schema + `school_id` + RLS** | Logical (enforced by Postgres RLS) | Cheapest, one migration, scales to thousands | **SaaS like RPS** ✅ |

**Decision: Shared database, shared schema, discriminator column (`school_id`) on every tenant-owned table, enforced by Row Level Security.** This is the standard, correct choice for a Supabase-backed SaaS targeting thousands of small tenants. It keeps migrations singular, cost minimal, and — critically — pushes isolation down into the database engine where it cannot be bypassed by an application bug.

```
┌──────────────────────────────────────────────────────────────┐
│                     Single PostgreSQL DB                       │
│                                                                │
│  students                      RLS POLICY (every table):       │
│  ┌──────────┬──────────┐       USING (                         │
│  │ school_id│ ...       │       school_id = auth_school_id()    │
│  ├──────────┼──────────┤       )                               │
│  │ sch_A    │ Ada       │  ◄── Tenant A sees only sch_A rows    │
│  │ sch_A    │ Bola      │                                       │
│  │ sch_B    │ Chidi     │  ◄── Tenant B sees only sch_B rows    │
│  └──────────┴──────────┘                                       │
│                                                                │
│  auth_school_id()  reads  (auth.jwt() -> app_metadata->school_id)│
└──────────────────────────────────────────────────────────────┘
```

> **Why RLS over "just filter by school_id in queries":** Application-level filtering is one forgotten `WHERE` clause away from a catastrophic cross-tenant data leak. RLS makes the database refuse to return another tenant's rows even if the query is wrong. Defense in depth: you *also* scope queries in the repository layer, but RLS is the backstop you cannot forget.

### 4.2 School-based data separation

- Every tenant-owned table has `school_id uuid NOT NULL REFERENCES schools(id)`.
- A composite/covering index leads with `school_id` (e.g., `(school_id, class_id, term_id)`) so tenant-scoped queries are fast and the planner prunes by tenant first.
- The `school_id` is **never** taken from the request body. It is derived from the authenticated user's JWT claim server-side. Client input cannot set tenant context.

### 4.3 School configuration system

Treat each school as a bag of configuration that the engine and UI read at runtime. Keep config **versioned by session** so historical results remain reproducible even when a school changes its grading scale next year.

```
school_settings (one row per school, slow-changing global prefs)
  ├─ branding (logo_url, colors, report header text)
  ├─ locale (country, timezone, language, week-start)
  ├─ approval_policy (one_step | two_step, who_publishes)
  ├─ result_gate (fee_gating_enabled: bool)
  └─ feature_flags (jsonb)  ← per-tenant feature toggles

grading_systems (versioned, scoped to school + optional session/level)
  └─ grade_bands (min, max, grade, remark, grade_point)

assessment_schemes (versioned: CA1/CA2/Exam definitions + weights)
report_templates  (which template + configurable fields/labels)
```

> **Why version config by session:** A 2025/2026 report card must always recompute identically, even after the school switches from a 40/60 to 30/70 CA/Exam split in 2026/2027. Bind each result computation to the config snapshot active for that session/term. Never mutate historical config in place.

### 4.4 Subdomain strategy

| Stage | Strategy |
|-------|----------|
| MVP | Single domain with **path-based** or **post-login tenant resolution**: user logs in, JWT contains `school_id`, app loads that tenant. Optionally `app.rps.com/login` then resolve. Simplest, zero DNS work. |
| Phase 2 | **Subdomain per school**: `greenfield.rps.com`, `unity.rps.com`. Wildcard DNS `*.rps.com` → one Next.js deployment. Next.js **middleware** reads the `Host` header, resolves subdomain → `school_id`, sets tenant context, and (for unauthenticated pages) themes the login page with that school's branding. |
| Enterprise | **Custom domains** (`results.greenfieldschool.com` CNAME → platform), with per-tenant TLS via your host (Vercel custom domains / Cloudflare for SaaS). |

```
Request: greenfield.rps.com/dashboard
        │
        ▼
 Next.js middleware
   ├─ parse Host → subdomain "greenfield"
   ├─ lookup school by subdomain (cached)
   ├─ attach x-school-id / x-school-slug to request headers
   └─ validate JWT.school_id === resolved school_id  (block mismatch)
        │
        ▼
 Server Components / Server Actions read tenant from request context
```

> **Security caveat:** The subdomain only *suggests* the tenant. The authoritative tenant is still the JWT claim. Always assert `jwt.school_id === resolvedSchoolId`, else a logged-in user of School A could try School B's subdomain. RLS still protects the data, but you should reject the mismatch early with a clear error.

### 4.5 School branding

Stored in `school_settings`: logo (Supabase Storage), primary/secondary colors (injected as CSS variables), report header/footer text, principal signature image, motto. Branding is applied:
- In-app via CSS custom properties set from settings on layout render.
- On report cards/broadsheets via the template renderer.
- On the (subdomain) login page once subdomain resolution exists.

### 4.6 Tenant-aware queries

- A **repository layer** wraps Supabase. Every repo method takes a `TenantContext { schoolId, userId, role }` and *cannot* be called without it (enforced by types).
- For privileged server work that must bypass RLS (e.g., Super Admin cross-tenant ops, system jobs), use the **service-role key only in trusted server code**, never exposed to the client, and always pass an explicit `schoolId` filter plus audit the action.
- Default to the **anon/auth client carrying the user's JWT** so RLS applies automatically.

### 4.7 Scaling strategy

- **Vertical first:** Supabase/Postgres handles thousands of small schools comfortably with proper indexing; scale the instance up as needed.
- **Read replicas** (Supabase supports) for heavy reporting/broadsheet reads, keeping writes on primary.
- **Connection pooling:** use Supabase's pooler (PgBouncer, transaction mode) — essential for serverless Next.js where connections are ephemeral.
- **Partitioning (later):** if `results`/`scores` grow huge, partition by `session_id` (time-based) so old sessions sit in cold partitions and active-term queries stay fast.
- **Tenant sharding (much later):** if a few mega-tenants dominate, you can route them to a dedicated DB; the `school_id`-everywhere design makes this migration mechanical.
- **Stateless app tier:** Next.js on serverless/edge scales horizontally for free; all state is in Postgres/Storage.

---

## 5. Database Architecture

### 5.1 Conventions (apply to every table)

- **Primary keys:** `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`. UUIDs avoid cross-tenant enumeration and ease merges.
- **Tenant column:** `school_id uuid NOT NULL REFERENCES schools(id)` on every tenant-owned table (omit only on truly global tables like `schools`, `permissions`).
- **Timestamps:** `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (maintained by trigger).
- **Soft delete:** `deleted_at timestamptz NULL`. Rows are never hard-deleted in academic tables; RLS/queries filter `deleted_at IS NULL`.
- **Auditing:** `created_by uuid`, `updated_by uuid` referencing `users`.
- **Money/scores:** use `numeric(6,2)` for scores, never `float` (no rounding surprises).
- **Enums:** model as Postgres `enum` or a lookup table; prefer lookup tables where values may grow per tenant (e.g., remarks).

### 5.2 Entity Relationship Overview

```
                         ┌──────────┐
                         │ schools  │ (tenant root)
                         └────┬─────┘
        ┌────────────────────┼─────────────────────────────┐
        │                    │                              │
   ┌────▼────┐         ┌─────▼──────┐                ┌───────▼────────┐
   │  users  │         │  sessions  │                │ school_settings│
   └────┬────┘         └─────┬──────┘                └────────────────┘
        │                    │
   ┌────▼─────────┐    ┌─────▼──────┐
   │ user_roles   │    │   terms    │
   └────┬─────────┘    └─────┬──────┘
        │                    │
   ┌────▼────┐         ┌─────▼───────┐    ┌──────────┐   ┌──────────┐
   │  roles  │         │   classes   │    │ subjects │   │  staff   │
   └────┬────┘         └─────┬───────┘    └────┬─────┘   └────┬─────┘
        │                    │                 │              │
 ┌──────▼────────┐    ┌──────▼──────────┐  ┌───▼──────────────▼───┐
 │role_permissions│   │   enrollments   │  │   class_subjects     │
 └──────┬────────┘    │ (student↔class) │  │(class×subject×teacher│
        │             └──────┬──────────┘  │  per term)           │
 ┌──────▼──────┐            │              └───────────┬──────────┘
 │ permissions │       ┌────▼─────┐                    │
 └─────────────┘       │ students │                    │
                       └────┬─────┘             ┌───────▼─────────┐
              ┌─────────────┘                   │     scores      │
        ┌─────▼──────────┐                      │(student×class_  │
        │student_guardians│                     │ subject×assess) │
        └─────┬──────────┘                      └───────┬─────────┘
              │                                         │
        ┌─────▼─────┐                          ┌────────▼─────────┐
        │ guardians │                          │     results      │
        └───────────┘                          │(computed per     │
                                               │ student×subject  │
                                               │ ×term)           │
                                               └────────┬─────────┘
                                                        │
                                               ┌────────▼─────────┐
                                               │ term_results     │
                                               │(aggregate per    │
                                               │ student×term:    │
                                               │ avg, position…)  │
                                               └──────────────────┘
   Cross-cutting: grading_systems→grade_bands, assessment_schemes,
   report_templates, approvals, audit_logs, notifications, score_history.
```

### 5.3 Core tables (key columns, keys, indexes)

> Columns shown are the meaningful ones; assume every tenant table also has `school_id, created_at, updated_at, deleted_at, created_by, updated_by`.

#### Tenancy & identity

**`schools`** (global)
- `id`, `name`, `slug` (unique, for subdomain), `email`, `phone`, `address`, `country`, `status` (`active|suspended|trial`), `subscription_tier`, `trial_ends_at`.
- Indexes: `UNIQUE(slug)`, `INDEX(status)`.

**`school_settings`**
- `school_id` (PK/unique), `logo_url`, `primary_color`, `secondary_color`, `timezone`, `locale`, `approval_policy` (`one_step|two_step`), `fee_gating_enabled bool`, `feature_flags jsonb`.

**`users`** (mirrors Supabase `auth.users` via `id`)
- `id` (= auth uid), `school_id` (NULL for super admin), `full_name`, `email`, `phone`, `status`, `last_login_at`.
- A user belongs to exactly one school (except platform staff). For multi-school staff later, introduce `user_school_memberships`.
- Indexes: `INDEX(school_id)`, `UNIQUE(school_id, email)`.

**`roles`**
- `id`, `school_id` (NULL = system role), `key` (`super_admin|school_admin|principal|...`), `name`, `is_system bool`.
- Indexes: `UNIQUE(school_id, key)`.

**`permissions`** (global)
- `id`, `key` (`scores.write`, `results.approve`, `students.read`, …), `description`.

**`role_permissions`**
- `role_id`, `permission_id`. PK `(role_id, permission_id)`.

**`user_roles`**
- `user_id`, `role_id`, `school_id`. PK `(user_id, role_id)`. (A user may hold multiple roles, e.g., Form Teacher + Subject Teacher.)

#### Academic structure

**`sessions`** (academic year, e.g., 2025/2026)
- `id`, `school_id`, `name`, `starts_on`, `ends_on`, `is_current bool`.
- Index: `INDEX(school_id, is_current)`.

**`terms`**
- `id`, `school_id`, `session_id`, `name` (`First|Second|Third`), `sequence smallint`, `starts_on`, `ends_on`, `is_current bool`.
- Index: `INDEX(school_id, session_id)`, partial `UNIQUE(school_id, is_current) WHERE is_current`.

**`classes`** (a grade/level + arm, e.g., JSS1 A)
- `id`, `school_id`, `name`, `level` (`primary|junior_secondary|senior_secondary`), `grade_order smallint` (for promotion ordering), `arm` (A/B/Gold…), `form_teacher_id` (staff), `next_class_id` (for promotion).
- Index: `INDEX(school_id)`, `INDEX(school_id, grade_order)`.

**`subjects`**
- `id`, `school_id`, `name`, `code`, `category` (`core|elective`), `applies_to_levels` (array/jsonb).
- Index: `UNIQUE(school_id, code)`.

**`class_subjects`** (which subject is offered in which class, taught by which teacher, in which term)
- `id`, `school_id`, `class_id`, `subject_id`, `term_id`, `teacher_id` (staff/user), `is_active bool`.
- Index: `UNIQUE(school_id, class_id, subject_id, term_id)`, `INDEX(school_id, teacher_id, term_id)` (powers "my classes").

**`staff`**
- `id`, `school_id`, `user_id` (nullable until they accept invite), `staff_no`, `full_name`, `phone`, `qualification`, `status`, `is_teaching bool`.
- Index: `INDEX(school_id)`, `UNIQUE(school_id, staff_no)`.

#### People

**`students`**
- `id`, `school_id`, `admission_no`, `first_name`, `last_name`, `other_names`, `gender`, `date_of_birth`, `photo_url`, `status` (`active|graduated|withdrawn|transferred`), `current_class_id` (denormalized convenience).
- Index: `UNIQUE(school_id, admission_no)`, `INDEX(school_id, current_class_id)`, `INDEX(school_id, status)`.

**`guardians`**
- `id`, `school_id`, `user_id` (nullable), `full_name`, `phone`, `email`, `relationship_default`.

**`student_guardians`** (M:N)
- `student_id`, `guardian_id`, `relationship`, `is_primary bool`. PK `(student_id, guardian_id)`.

**`enrollments`** (a student's placement in a class for a session/term — the historical truth)
- `id`, `school_id`, `student_id`, `class_id`, `session_id`, `term_id`, `roll_no`, `status` (`active|left`), `enrolled_on`.
- Index: `UNIQUE(school_id, student_id, term_id)`, `INDEX(school_id, class_id, term_id)`.

> **Why a separate `enrollments` table (not just `students.current_class_id`):** results must be tied to *which class the student was in that term*. A student who repeats or transfers must keep historically correct results. `current_class_id` is only a convenience cache for the UI; `enrollments` is the source of truth for computation.

#### Grading & assessment configuration

**`grading_systems`** (versioned)
- `id`, `school_id`, `name`, `session_id` (nullable = applies to all), `level` (nullable = all levels), `is_active bool`.

**`grade_bands`**
- `id`, `grading_system_id`, `min_score numeric`, `max_score numeric`, `grade` (`A1|B2|...` or `A|B|C`), `remark` (`Excellent|...`), `grade_point numeric` (nullable), `sort_order`.
- Constraint: bands within a system must not overlap (validated in service layer + a check at insert).

**`assessment_schemes`** (defines components & weights, versioned per session/level)
- `id`, `school_id`, `session_id` (nullable), `level` (nullable), `name`, `is_active bool`.

**`assessment_components`**
- `id`, `scheme_id`, `key` (`ca1|ca2|ca3|exam`), `label`, `max_score numeric`, `weight numeric` (or use `max_score` as the de-facto weight), `sort_order`, `is_exam bool`.
- Example: CA1 max 20, CA2 max 20, Exam max 60 → total 100. Or weighted: components sum to a configured total.

#### Scores & results (the heart)

**`scores`** (raw input — one row per student × class_subject × component)
- `id`, `school_id`, `enrollment_id`, `class_subject_id`, `assessment_component_id`, `term_id`, `score numeric(6,2) NULL`, `is_absent bool`, `is_exempt bool`, `entered_by`, `status` (`draft|submitted`).
- Index: `UNIQUE(school_id, enrollment_id, class_subject_id, assessment_component_id, term_id)`, `INDEX(school_id, class_subject_id, term_id)`.

**`results`** (computed — one row per student × subject × term)
- `id`, `school_id`, `enrollment_id`, `class_subject_id`, `subject_id`, `term_id`, `ca_total numeric`, `exam_score numeric`, `total numeric`, `grade`, `grade_point numeric`, `remark`, `subject_position int`, `subject_count int` (n students), `is_absent bool`, `computed_at`, `config_snapshot jsonb` (the grading/assessment config used), `status`.
- Index: `UNIQUE(school_id, enrollment_id, class_subject_id, term_id)`, `INDEX(school_id, class_subject_id, term_id, total DESC)` (for positions).

**`term_results`** (aggregate per student per term — drives the report card header)
- `id`, `school_id`, `enrollment_id`, `class_id`, `term_id`, `subjects_count`, `total_obtainable numeric`, `total_obtained numeric`, `average numeric(5,2)`, `class_position int`, `class_size int`, `grade_overall`, `attendance_present int`, `attendance_total int`, `promotion_status` (`promoted|repeat|pending|na`), `class_teacher_remark`, `principal_remark`, `published_at`, `status`.
- Index: `UNIQUE(school_id, enrollment_id, term_id)`, `INDEX(school_id, class_id, term_id, average DESC)`.

**`cumulative_results`** (Phase 2 — annual rollup across terms)
- `id`, `school_id`, `enrollment_id`, `session_id`, `cumulative_average numeric`, `annual_position int`, `promotion_status`, `computed_at`.

#### Workflow, audit, notifications

**`approvals`** (state machine instances)
- `id`, `school_id`, `subject_type` (`class_subject_result|term_result|class`), `subject_id`, `term_id`, `state` (`draft|submitted|l1_approved|approved|published|returned`), `current_owner_role`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `published_at`, `notes`.
- Index: `INDEX(school_id, subject_type, subject_id, term_id)`.

**`approval_events`** (immutable log of each transition)
- `id`, `approval_id`, `from_state`, `to_state`, `actor_id`, `actor_role`, `comment`, `created_at`.

**`score_history`** (append-only audit of every score change — never updated/deleted)
- `id`, `school_id`, `score_id`, `enrollment_id`, `class_subject_id`, `assessment_component_id`, `old_value numeric`, `new_value numeric`, `old_is_absent bool`, `new_is_absent bool`, `changed_by`, `reason`, `changed_at`.
- Index: `INDEX(school_id, score_id, changed_at)`.

**`audit_logs`** (system-wide activity)
- `id`, `school_id`, `actor_id`, `actor_role`, `action` (`student.create`, `result.publish`, `user.login`, `grading.update`…), `entity_type`, `entity_id`, `metadata jsonb`, `ip`, `user_agent`, `created_at`.
- Index: `INDEX(school_id, created_at DESC)`, `INDEX(school_id, entity_type, entity_id)`.

**`notifications`**
- `id`, `school_id`, `recipient_user_id`, `channel` (`in_app|email|sms|whatsapp`), `type`, `payload jsonb`, `read_at`, `sent_at`, `status`.

**`report_templates`**
- `id`, `school_id`, `name`, `template_key` (which built-in layout), `config jsonb` (toggles: show traits, show attendance, show comments, color), `is_default bool`.

**`attendance`** (Phase 2, term-level summary feeding report card)
- `id`, `school_id`, `enrollment_id`, `term_id`, `days_present int`, `days_total int`, `recorded_by`.

**`fee_status`** (Phase 2, for bursary result gating)
- `id`, `school_id`, `enrollment_id`, `term_id`, `status` (`cleared|owing|partial`), `updated_by`, `note`.

### 5.4 Indexing strategy (the most important performance lever)

| Query pattern | Index |
|---------------|-------|
| All tenant queries | Lead every composite index with `school_id` |
| "My classes this term" (teacher) | `class_subjects(school_id, teacher_id, term_id)` |
| Score sheet load | `scores(school_id, class_subject_id, term_id)` |
| Subject position computation | `results(school_id, class_subject_id, term_id, total DESC)` |
| Class position / broadsheet | `term_results(school_id, class_id, term_id, average DESC)` |
| Student result history | `results(school_id, enrollment_id, term_id)` |
| Audit lookups | `audit_logs(school_id, entity_type, entity_id)` |

> Use **partial indexes** for soft-delete (`WHERE deleted_at IS NULL`) and for `is_current` flags. Add `BRIN` indexes on `created_at` for very large audit tables. Periodically `EXPLAIN ANALYZE` the broadsheet query — it's your hottest read.

### 5.5 Soft delete strategy

- Academic data (students, results, scores, classes) is **soft-deleted** (`deleted_at`), never hard-deleted, to preserve historical integrity and allow undo.
- RLS policies and repository defaults add `AND deleted_at IS NULL`.
- Provide an admin "recycle bin" view for restore.
- Genuinely transient data (notifications, draft imports) may be hard-deleted on retention schedule.

### 5.6 History / versioning strategy

Three complementary mechanisms:

1. **Append-only `score_history`** — every raw score change writes a history row (via a Postgres trigger on `scores`). This is the legal/audit record of "who changed what mark and when, and why."
2. **Config snapshot on `results`** (`config_snapshot jsonb`) — each computed result stores the exact grading/assessment config used, so recomputation is reproducible even after config changes.
3. **`approval_events`** — immutable transition log for the workflow.

> **Why triggers for `score_history`:** application code can forget to log; a database trigger cannot be bypassed by any code path (including bulk imports and admin scripts). Combine with application-level `audit_logs` for richer context (reason, request id).

---

## 6. Result Engine Design

This is the product's core. Design it as a **pure, deterministic, idempotent computation module** decoupled from the database and HTTP layers, so it is unit-testable in isolation and reproducible forever.

### 6.1 Design principles

1. **Pure functions over a snapshot of inputs.** The engine takes (raw scores + config snapshot + roster) and returns computed results. No DB calls inside the math. This makes it deterministic and trivially testable.
2. **Idempotent & re-runnable.** Recomputing the same inputs yields identical outputs. Computation writes to `results`/`term_results` via upsert; never appends duplicates.
3. **Config-driven, not hard-coded.** Grading bands, component weights, position rules, promotion rules all come from data.
4. **Snapshot-bound.** Every computation references the config version active for that session/term and stores it on the result for reproducibility.
5. **Separation of compute and approve.** Computing a result ≠ publishing it. Computation can happen many times in draft; only approval/publish locks it.

### 6.2 Architecture

```
        ┌────────────────────────────────────────────────────────┐
        │                    Result Engine (pure)                  │
        │                                                          │
  inputs│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │ outputs
  ─────►│  │ Aggregator   │─►│ Grader       │─►│ Ranker        │  │─────►
        │  │ CA+Exam→total│  │ total→grade  │  │ totals→positions│ │
        │  └──────────────┘  └──────────────┘  └───────────────┘  │
        │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
        │  │ TermAggregator│ │ RemarkResolver│ │ PromotionRules│  │
        │  │ subjects→avg  │  │ rule→remark  │  │ avg→promote   │  │
        │  └──────────────┘  └──────────────┘  └───────────────┘  │
        └────────────────────────────────────────────────────────┘
                 ▲                                      │
   ResultService (orchestrator, DB-aware)               │
   ── loads scores, config snapshot, roster ────────────┘
   ── validates, calls engine, persists upsert, writes audit, updates approval state
```

- **`ResultEngine`** (pure, `/lib/result-engine/`): aggregation, grading, ranking, term aggregation, remark resolution, promotion. No I/O.
- **`ResultService`** (orchestrator, `/modules/results/service`): loads inputs from repositories, builds the config snapshot, invokes the engine, persists via upsert, writes audit, advances workflow. Handles transactions and locking.

### 6.3 Computation flow

```
1. SCOPE        choose (school, class, term) and optionally a single class_subject
2. LOAD         roster (enrollments), raw scores, grading_system + grade_bands,
                assessment_scheme + components  → build CONFIG SNAPSHOT
3. VALIDATE     missing/invalid/out-of-range scores; absentees; exemptions  (see 6.5)
4. AGGREGATE    per student per subject:
                ca_total = Σ(CA components), exam = exam component,
                total = ca_total + exam (or weighted), rounded per policy
5. GRADE        map total → grade band → grade, grade_point, default remark
6. RANK SUBJECT order students within (class_subject, term) by total DESC →
                subject_position (handle ties, exclude absentees per policy)
7. TERM AGG     per student: subjects_count, total_obtained, total_obtainable,
                average, overall grade
8. RANK CLASS   order students within (class, term) by average DESC →
                class_position (ties handled), class_size
9. ATTENDANCE   merge attendance summary (Phase 2)
10. PROMOTION   apply promotion rule → promotion_status (annual: cumulative)
11. REMARKS     auto remarks + slots for class_teacher_remark / principal_remark
12. PERSIST     upsert results + term_results (transaction), store config_snapshot,
                write audit, set status=computed (still unpublished)
```

### 6.4 Configurable rules (all data-driven)

| Rule area | Configuration | Examples |
|-----------|---------------|----------|
| Components & weights | `assessment_components` | CA1=10, CA2=10, CA3=20, Exam=60; or 40/60 |
| Total scaling | scheme setting | Components sum to 100; or scale to 100 from weights |
| Grade bands | `grade_bands` | 70–100=A1, 60–69=B2 … or 75+=A (primary) |
| Rounding | school setting | round half-up to 0 or 2 dp |
| Position scope | school setting | per-arm vs per-grade-level (combine JSS1A+JSS1B?) |
| Tie handling | school setting | `dense` (1,2,2,3) vs `standard` (1,2,2,4) |
| Absentee in ranking | school setting | excluded vs counted as 0 |
| Position basis | school setting | by total average vs by total obtained |
| Promotion | promotion rule | avg ≥ X; or pass core subjects; or cumulative ≥ X |
| Remark source | grade band remark / rule | per-grade remark vs average-based comment templates |

### 6.5 Validation rules

**Before computing**, the service refuses to finalize if:
- Any enrolled, non-exempt student is missing a required component score (unless marked absent).
- Any score is outside `[0, component.max_score]`.
- A grading system / assessment scheme is not configured or its bands overlap / leave gaps.
- The term/session is closed or the result is already locked/published (unless in an authorized correction flow).

It **warns** (but can proceed) when:
- A whole class-subject has no scores (subject perhaps not taught).
- Unusual distributions (e.g., everyone scored 0) — surfaced as an anomaly flag for review.

### 6.6 Edge cases (enumerate and decide explicitly)

| Edge case | Decision |
|-----------|----------|
| Student absent for exam | `is_absent=true`; total may be CA-only or "ABS"; configurable; excluded from position per policy |
| Student exempt from a subject | `is_exempt=true`; subject excluded from their average denominator |
| Mid-term transfer in | Enrollment dated; only subjects with scores count; flag partial |
| Ties in position | Apply configured tie strategy consistently across report + broadsheet |
| New subject added mid-term | Recompute denominator; warn if scores incomplete |
| Score edited after computation | Re-run engine; bump result version; require reason; audit; cannot edit if locked |
| Division by zero (no graded subjects) | Average = null / "N/A", never crash; mark incomplete |
| Single student in a class | Position = 1; class_size = 1 (avoid "1 of 1" awkwardness via template copy) |
| Decimal/rounding drift | All math in `numeric`; round once at defined step; store both raw and rounded |
| Duplicate scores from bulk import | Upsert on unique key; import preview catches conflicts |
| Withdrawn student | Excluded from active roster and positions; historical results retained |

### 6.7 Result locking & approval workflow

A simple, explicit **state machine** (stored in `approvals`, transitions in `approval_events`):

```
 ┌────────┐  submit   ┌───────────┐  L1 approve  ┌────────────┐  approve  ┌──────────┐  publish  ┌───────────┐
 │ DRAFT  │──────────►│ SUBMITTED │─────────────►│ L1_APPROVED│──────────►│ APPROVED │──────────►│ PUBLISHED │
 └────────┘           └─────┬─────┘   (2-step)   └─────┬──────┘           └────┬─────┘           └─────┬─────┘
   ▲  ▲                     │ return                   │ return                │                       │ correction
   │  └──────────────────── │ ◄────────────────────────┘                       │                       │ (re-open w/ reason)
   │                        ▼                                                   ▼                       ▼
   │                   ┌──────────┐                                      (LOCKED for edit)      ┌──────────────┐
   └───────────────────│ RETURNED │                                                            │ CORRECTION   │
        edit + resubmit └──────────┘                                                            │ (audited)    │
                                                                                                └──────────────┘
```

- **Locking:** at `SUBMITTED` (or `APPROVED`, configurable) scores become read-only. Only an unlock (by authorized role, with reason, audited) or a `RETURNED` transition reopens editing.
- **One-step vs two-step** approval chosen per school (`approval_policy`). Two-step routes through VP (L1) then Principal.
- **Publish** is the only state visible to students/parents. Pre-publish, results are invisible to consumers regardless of role.
- **Corrections after publish** never silently overwrite: they create a new result version, require a reason, re-issue the report card (the QR/verification reflects the latest version), and are fully audited.

### 6.8 Scalability concerns

- **Batch over row-by-row.** Compute a whole class-subject (or class) in one pass in memory, then bulk-upsert. Avoid N queries for N students.
- **Ranking in SQL when large.** For positions across big cohorts, `RANK()/DENSE_RANK() OVER (PARTITION BY class_subject_id ORDER BY total DESC)` in a single query beats application sorting; keep the tie strategy consistent with the engine.
- **Background computation for big batches.** Whole-school recompute runs as a background job (see §14.6) with progress reporting, not in a request.
- **Caching computed results.** Once published, results are immutable until corrected — cache report-card payloads aggressively.
- **Idempotent re-runs** mean a failed batch can be safely retried.

---

## 7. Application Architecture (Next.js)

### 7.1 Architectural style

A **modular monolith** using **Domain-Driven Design (DDD)** boundaries inside one Next.js App Router codebase. Each domain (students, results, grading, …) is a self-contained module with its own schema (Zod), repository, service, and UI. This gives the clarity of microservices without their operational cost — and the seams to split later if ever needed.

**Layering (dependencies point downward only):**

```
┌─────────────────────────────────────────────────────────┐
│ UI layer        app/ (routes), components/ (shadcn-based) │  React Server/Client Components
├─────────────────────────────────────────────────────────┤
│ Action layer    Server Actions + Route Handlers           │  auth + validation + delegate
├─────────────────────────────────────────────────────────┤
│ Service layer   business logic, orchestration, workflow   │  pure-ish; the result engine lives here-adjacent
├─────────────────────────────────────────────────────────┤
│ Repository layer  tenant-aware data access (Supabase)     │  the ONLY layer that talks to the DB
├─────────────────────────────────────────────────────────┤
│ Database         PostgreSQL + RLS                          │
└─────────────────────────────────────────────────────────┘
```

> **Rule:** UI never touches the repository directly. Actions never embed business logic. Services never run raw SQL except through repositories. The result engine has **zero** I/O. These boundaries are what keep a fast-growing codebase maintainable.

### 7.2 Production folder structure

```
rps/
├── app/                                  # Next.js App Router (routing + thin pages only)
│   ├── (public)/                         # marketing, login, public verification
│   │   ├── login/
│   │   ├── verify/[code]/                # QR result verification (public)
│   │   └── page.tsx
│   ├── (auth)/                           # authenticated app shell
│   │   ├── layout.tsx                    # tenant + auth guard, theming from school_settings
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── staff/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── scores/                       # score entry sheets
│   │   ├── results/                      # compute, review, broadsheet
│   │   ├── approvals/
│   │   ├── reports/                      # report cards, PDF
│   │   ├── settings/                     # grading, sessions, terms, templates, branding
│   │   └── imports/                      # bulk import wizard
│   ├── (super-admin)/                    # platform console (cross-tenant)
│   │   ├── schools/
│   │   ├── billing/
│   │   └── audit/
│   ├── api/                              # Route Handlers (webhooks, file exports, cron)
│   │   ├── webhooks/payments/
│   │   ├── reports/[id]/pdf/route.ts
│   │   └── cron/recompute/route.ts
│   └── layout.tsx
│
├── modules/                              # DOMAIN MODULES (the real architecture)
│   ├── auth/
│   │   ├── schema.ts                     # Zod
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── actions.ts                    # "use server"
│   ├── tenancy/                          # school resolution, settings, context
│   ├── students/
│   │   ├── schema.ts
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   ├── actions.ts
│   │   └── components/                   # student-specific UI
│   ├── staff/
│   ├── academics/                        # sessions, terms, classes, subjects, class_subjects
│   ├── grading/                          # grading_systems, grade_bands, assessment schemes
│   ├── scores/
│   ├── results/
│   │   ├── service.ts                    # ResultService orchestrator
│   │   ├── repository.ts
│   │   └── actions.ts
│   ├── approvals/                        # workflow state machine
│   ├── reports/                          # report cards, broadsheet, PDF
│   ├── imports/                          # bulk import pipeline
│   ├── notifications/
│   └── audit/
│
├── lib/                                  # framework-agnostic shared code
│   ├── result-engine/                    # PURE computation (no I/O) — the crown jewel
│   │   ├── aggregate.ts
│   │   ├── grade.ts
│   │   ├── rank.ts
│   │   ├── term-aggregate.ts
│   │   ├── promotion.ts
│   │   ├── remarks.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── supabase/
│   │   ├── server.ts                     # server client (cookies/JWT)
│   │   ├── admin.ts                      # service-role client (server-only, guarded)
│   │   └── middleware.ts
│   ├── authz/                            # can(user, action, resource) + assignment checks
│   ├── validation/                       # shared Zod helpers
│   ├── pdf/                              # PDF rendering utilities
│   ├── errors/                           # typed error classes, result/either helpers
│   ├── logger/
│   └── utils/
│
├── components/
│   ├── ui/                               # shadcn/ui primitives
│   ├── data-table/                       # reusable table (sort/filter/paginate)
│   ├── forms/                            # form field wrappers (RHF + Zod)
│   └── layout/                           # shell, sidebar, topbar
│
├── db/
│   ├── migrations/                       # SQL migrations (source of truth)
│   ├── policies/                         # RLS policy SQL
│   ├── functions/                        # SQL functions, triggers
│   └── seed/
│
├── types/                                # generated DB types + shared types
├── tests/                                # unit / integration / e2e
├── config/                               # env, constants, feature flags
└── middleware.ts                         # tenant + auth at the edge
```

### 7.3 DDD / module conventions

- Each module owns: `schema.ts` (Zod = the single validation source), `repository.ts` (DB), `service.ts` (logic), `actions.ts` (server actions), optional `components/`.
- **Cross-module calls go through services, never repositories.** `results/service` calls `grading/service` to fetch config, not `grading/repository`.
- **Types flow from Zod** (`z.infer`) and from generated Supabase types — never hand-maintain DTOs that can drift.

### 7.4 Service layer

- Stateless functions/classes that take a `TenantContext` and inputs, enforce authorization (`can(...)`) and business rules, coordinate repositories within a transaction, emit audit + notifications.
- Return **typed results** (`{ ok: true, data } | { ok: false, error }`) rather than throwing for expected failures (validation, permission), reserving throws for truly exceptional states.

### 7.5 Repository pattern

- The only layer importing the Supabase client. Methods are tenant-scoped by construction (require `schoolId`).
- Encapsulates `select` shapes, joins, pagination, and soft-delete filtering so query details don't leak into services.
- Two client flavors: **user-scoped** (RLS-enforced, default) and **admin/service-role** (guarded, server-only, for jobs/super-admin), chosen explicitly per method.

### 7.6 Validation layer

- **Zod schemas** validate at every boundary: server action inputs, route handler bodies, import rows, and config.
- One schema per concept, reused on the client (react-hook-form resolver) and server (action) — **never trust client validation alone; always re-validate server-side.**

### 7.7 API strategy — Server Actions vs Route Handlers

| Use **Server Actions** for | Use **Route Handlers (`app/api`)** for |
|------------------------------|----------------------------------------|
| Form mutations from the app UI (create student, save scores, submit) | Webhooks (payment provider) |
| Progressive-enhancement forms | File downloads/streams (PDF, Excel export) |
| Anything tightly coupled to a React component | Cron endpoints / background triggers |
| | Public endpoints (QR verification) |
| | Future third-party/mobile API |

> Default to **Server Actions** for the in-app CRUD and workflow — less boilerplate, type-safe, co-located. Reach for Route Handlers when you need a real HTTP surface (external callers, streaming, non-browser clients). Keep both **thin**: authenticate, validate with Zod, delegate to a service.

### 7.8 Shared utilities & reusable modules

- `lib/authz` — central `can()` + assignment checks (single source of authorization truth).
- `components/data-table` — one configurable table powering students/staff/scores/broadsheet lists.
- `components/forms` — standardized field components bound to RHF + Zod.
- `lib/errors` — typed errors mapped to friendly UI messages.
- `lib/pdf` + `modules/reports` — one rendering pipeline reused for report card and broadsheet.

---

## 8. Authentication & Authorization

### 8.1 Supabase Auth setup

- Use **Supabase Auth** (GoTrue) with email/password (+ magic link for parents/students who struggle with passwords). Email confirmation for staff invites.
- **Provisioning model:** School Admins **invite** staff (creates `auth.users` + `users` + `user_roles` rows, sends invite). Students/parents are created by the school; parents may self-claim via a tokenized invite link.
- **Custom claims:** On signup/role assignment, write `school_id` and `roles` into the user's **`app_metadata`** (server-side, via admin API) so they appear in the JWT. `app_metadata` is **not user-editable**, unlike `user_metadata` — critical for trust.

```jsonc
// JWT (decoded) — app_metadata is authoritative for tenancy & role
{
  "sub": "user-uuid",
  "email": "teacher@school.com",
  "app_metadata": {
    "school_id": "school-uuid",
    "roles": ["teacher", "form_teacher"]
  }
}
```

### 8.2 RBAC implementation

- **Capability check** (`can(user, 'scores.write')`): reads `role_permissions` (cached) for the user's roles.
- **Scope/assignment check**: e.g., `isAssignedToClassSubject(userId, classSubjectId, termId)` for teachers; `isFormTeacherOf(userId, classId)` for form teachers.
- Every mutating service call runs **both** checks. Authorization lives in `lib/authz`, never inline in components.

### 8.3 Row Level Security (RLS) — the backbone

Enable RLS on **every** tenant table. Core helper + policy pattern:

```sql
-- Helper: read school_id from the JWT (set in app_metadata)
create or replace function auth.school_id() returns uuid
language sql stable as $$
  select nullif(
    (current_setting('request.jwt.claims', true)::jsonb
       -> 'app_metadata' ->> 'school_id'), ''
  )::uuid;
$$;

-- Example policy on students
alter table students enable row level security;

create policy tenant_isolation_students on students
  for all
  using  (school_id = auth.school_id() and deleted_at is null)
  with check (school_id = auth.school_id());

-- Finer policy example: students/parents read only published, own data
create policy student_self_read on term_results
  for select
  using (
    school_id = auth.school_id()
    and status = 'published'
    and enrollment_id in (select id from enrollments
                          where student_id = auth.uid())
  );
```

- **`USING`** filters reads/updates to the tenant; **`WITH CHECK`** prevents inserting/updating rows into another tenant.
- Layer role-specific policies (teacher write only to assigned class_subjects via a policy that joins `class_subjects`).
- **Service-role key bypasses RLS** — use it only in vetted server code (jobs, super-admin) and always pass explicit `school_id` filters.

> **Why RLS is non-negotiable here:** in a multi-tenant academic system, a cross-tenant leak (School A sees School B's students/results) is an existential, trust-destroying bug. RLS makes the database itself the last line of defense, independent of any application mistake.

### 8.4 JWT / session handling

- Supabase issues short-lived **access JWT** + **refresh token**, stored in **httpOnly cookies** via `@supabase/ssr` (not localStorage — avoids XSS token theft).
- Server Components/Actions read the session from cookies via the server client; tokens refresh transparently.
- On role change, **force token refresh** (or short access-token TTL) so updated claims take effect promptly.

### 8.5 Middleware & route protection

`middleware.ts` runs at the edge on every request:

```
1. Refresh Supabase session (rotate cookies).
2. Resolve tenant (subdomain → school) [Phase 2]; cache lookup.
3. If route is protected and no valid session → redirect to /login.
4. Assert jwt.app_metadata.school_id === resolvedSchoolId (block mismatch).
5. (Coarse) gate super-admin routes to platform roles only.
6. Attach school context headers for downstream server code.
```

- **Coarse gating in middleware; fine-grained authorization in services.** Middleware blocks the obviously-unauthenticated and wrong-tenant; the service layer makes the real per-resource decision. Never rely on middleware alone for data authorization.

### 8.6 Tenant-aware authentication recap

Three independent checks must all agree before a write succeeds:
1. **Authenticated** (valid session).
2. **Right tenant** (JWT `school_id` matches the resource's `school_id`; RLS enforces in DB).
3. **Authorized** (role capability + assignment scope in the service layer).

---

## 9. Security Architecture

### 9.1 Input validation
- **Zod at every boundary** (actions, route handlers, import rows). Validate types, ranges (score ∈ [0, max]), enums, and lengths server-side regardless of client checks.
- Reject unknown fields (`.strict()`) on sensitive inputs to prevent mass-assignment (e.g., a client trying to set `school_id` or `role`).

### 9.2 SQL injection prevention
- All DB access via the Supabase client / parameterized queries / RPC — **never** string-concatenated SQL. If raw SQL is unavoidable in a DB function, use parameters. RLS further limits blast radius.

### 9.3 Rate limiting
- Apply per-IP and per-user limits on auth endpoints (login, password reset, magic link), bulk imports, and PDF/export generation. Use Upstash Redis (or Supabase edge + KV) sliding-window limiter in middleware/route handlers. Protects against brute force and resource exhaustion.

### 9.4 CSRF / XSS protection
- **CSRF:** Server Actions are origin-checked by Next.js; for Route Handlers that mutate, verify `Origin`/`Referer` and use SameSite cookies. Auth cookies are `httpOnly`, `Secure`, `SameSite=Lax`.
- **XSS:** React escapes by default; **never** use `dangerouslySetInnerHTML` with user content. Sanitize any rich text (school remarks) with a strict allowlist. Set a strong **Content-Security-Policy**, plus `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` via Next.js headers.

### 9.5 Audit logging
- Every sensitive action (score change, result publish, role change, login, impersonation, config change) writes to `audit_logs` with actor, tenant, entity, before/after where relevant, IP, and user agent. `score_history` via DB trigger is tamper-resistant. (See §13.)

### 9.6 Activity monitoring
- Surface anomalies: bulk score edits after lock attempts, off-hours mass exports, repeated permission-denied, login from new device/geo. Feed into an admin "security activity" view and alerting (Sentry + log-based alerts).

### 9.7 Secure file uploads
- Uploads (logos, student photos, import sheets) go to **Supabase Storage** with: strict MIME + extension allowlist, size caps, content sniffing (don't trust extension), per-tenant bucket paths (`school_id/...`), and **Storage RLS** so a tenant can't read another's files. Serve via signed URLs with short TTL; never make academic files public.
- Strip EXIF/metadata from images. Scan import files server-side before parsing.

### 9.8 Backup strategy
- Rely on Supabase automated daily backups + **Point-in-Time Recovery (PITR)** on a paid plan (essential — results are irreplaceable).
- Additionally run a scheduled **logical export** (pg_dump) to independent cold storage (e.g., a separate cloud bucket) for defense against provider-side loss/account issues.
- Test restores **quarterly** — an untested backup is a hope, not a backup.

### 9.9 Disaster recovery
- Define **RPO ≤ 24h (target ≤ 1h with PITR)** and **RTO ≤ 4h**. Document a runbook: restore DB from PITR, redeploy app from Git, rotate keys, verify with smoke tests. Keep infra as code/scripts so re-provisioning is repeatable.

### 9.10 Encryption strategy
- **In transit:** TLS everywhere (host-managed). **At rest:** Postgres + Storage encrypted at rest (Supabase default).
- **Secrets:** in host env vars / secret manager, never in repo. Service-role key only server-side.
- **Sensitive fields:** consider column-level encryption (pgcrypto) for the most sensitive PII if regulations require; hash, don't store, anything that needn't be reversible.

---

## 10. Frontend Architecture

### 10.1 Dashboard structure
- **App shell**: collapsible sidebar (role-filtered nav), top bar (school switcher for super-admin, term selector, user menu), breadcrumb, content area.
- **Role-aware navigation**: nav items render from the same `can()` capability checks — a teacher never sees "Approvals."
- **Term/session context selector** persists in URL + cookie so every screen is scoped to the chosen term.

### 10.2 Reusable UI patterns (built on shadcn/ui)
- **DataTable**: one component for all lists — column defs, server-side sort/filter/pagination, row selection, bulk actions, CSV export. Students, staff, scores, broadsheet all reuse it.
- **EntityForm**: react-hook-form + Zod resolver + shadcn fields; consistent error display, dirty-state guard, optimistic save.
- **ScoreSheet**: a specialized editable grid (keyboard navigation, paste-from-Excel, per-cell validation, autosave draft, lock-aware read-only state). This is the most-used screen — invest in its ergonomics.
- **Wizard**: multi-step (used by bulk import and school setup).

### 10.3 Forms
- Zod-driven; inline validation; clear required markers; sensible defaults; autosave for long forms (score entry). Confirm-before-leave on unsaved changes.

### 10.4 Tables & filters
- Server-side pagination by default (never load 2,000 students client-side). Persistent filters in URL (shareable, back-button friendly). Saved views later.

### 10.5 Accessibility
- shadcn/Radix primitives are accessible by default — preserve it: label every field, keyboard-navigable score grid, visible focus, sufficient color contrast (important on cheap screens in bright classrooms), ARIA on custom widgets. Target WCAG 2.1 AA.

### 10.6 Responsiveness
- **Mobile-first.** Many teachers will enter scores on phones. Tables collapse to cards on small screens; score entry adapts to a single-subject, single-student-at-a-time flow on narrow viewports. Test on low-end Android + small screens, not just desktop.

### 10.7 Loading states
- React Suspense + skeletons for server components; optimistic UI for saves; route-level `loading.tsx`. Never a blank screen on slow networks — show structure immediately.

### 10.8 Error handling
- Route-level `error.tsx` with friendly, non-technical copy and a retry. Map typed service errors to human messages ("3 students are missing exam scores" — not "validation error"). Toasts for transient feedback; inline for field errors.

### 10.9 State management
- Lean on **server state**: Server Components + Server Actions + `revalidatePath`/`revalidateTag` are the default. For client interactivity (score grid, filters) use local state + lightweight `useOptimistic`/`nuqs` (URL state). Introduce **TanStack Query** only where rich client caching/optimistic flows demand it (e.g., the score sheet). Avoid heavy global stores (Redux) — they add complexity this app doesn't need.

### 10.10 Dark mode
- Tailwind + CSS variables + `next-themes`. Respect system preference; persist choice. Ensure report previews remain print-correct regardless of theme.

### 10.11 UX for non-technical school staff
- **Plain language**, not jargon ("Enter scores," not "Mutate assessment records").
- **Guided flows & wizards** for setup and imports; sensible defaults so a school can start with minimal config.
- **Forgiving inputs**: paste from Excel, autosave drafts, undo, clear "what's missing" checklists before submission.
- **Visible progress**: "JSS1A Maths — 28/30 students entered."
- **Confirmations on destructive/irreversible actions** (publish, unlock) with plain-English consequences.
- **Empty states that teach** ("No classes yet — add your first class to begin").
- **Inline help & tooltips**; an in-app onboarding checklist for new schools.

---

## 11. Report Card & PDF Generation

### 11.1 PDF generation strategy

| Option | How | Verdict |
|--------|-----|---------|
| **HTML → PDF via headless Chromium (Puppeteer/Playwright)** | Render a React/Next route to HTML, print to PDF in a server function or worker | **Recommended.** Pixel-perfect, reuses your styling, easy to template. Run in a background worker/route handler, not the edge. |
| `@react-pdf/renderer` | Define PDFs in React primitives | Good for simple, fixed layouts; less flexible CSS; fine as a lighter alternative |
| Server-side libs (pdfkit) | Low-level drawing | Too manual for rich report cards |
| Client-side (jsPDF/html2canvas) | In browser | Avoid for official docs — inconsistent, raster quality issues |

> **Recommendation:** Author report cards as a dedicated **print-styled HTML template** (Tailwind print classes) and render to PDF with **headless Chromium in a background job**. This reuses your component system, supports branding/QR/watermark trivially, and produces consistent, high-quality output. Generation for a whole class is a batched background job (§14.6) producing a zip or merged PDF.

### 11.2 Printable layouts
- A4 portrait, print CSS (`@page`, margins, page breaks per student), embedded fonts, school logo/header, subject table, totals/position, traits/attendance, remarks, signatures, footer with QR + generation timestamp. Avoid page-break splits mid-table.

### 11.3 Broadsheet generation
- The class-wide matrix (students × subjects with totals, average, position). Generated as **PDF (print)** and **Excel (.xlsx)** for offline work. Built from `results`/`term_results` in a single optimized query; positions precomputed.

### 11.4 Report templates
- 2–3 built-in, configurable templates (`report_templates.config jsonb`): toggle traits/attendance/comments, choose accent color, header text. Per-school selection. (A drag-drop designer is explicitly deferred — see §2.4.)

### 11.5 Signatures
- Principal/form-teacher signature images uploaded to Storage, rendered into the template. Optionally a typed-name + date line. For higher assurance later, digital signing of the PDF.

### 11.6 QR verification
- Each published report card embeds a QR linking to `/(public)/verify/[code]`. The code maps to a `term_result` version. The public page (no login) shows the authoritative summary (student, class, term, average, position, status, issue date) so anyone can confirm a printed card is genuine and unaltered. Corrections issue a new version → the QR always reflects the latest valid result.

### 11.7 Watermarking
- Draft/preview PDFs carry a prominent "DRAFT — NOT APPROVED" diagonal watermark to prevent unofficial copies circulating. Published cards omit it but include the QR + timestamp. Optionally a faint school-name watermark on official cards.

### 11.8 Export formats
- Report cards: **PDF** (single + batched zip/merged). Broadsheets: **PDF + XLSX**. Data exports (students, scores): **CSV/XLSX**. All exports are tenant-scoped, authorized, signed-URL delivered, and audited.

---

## 12. Bulk Import System

Bulk import is **adoption-critical** in African schools — staff already keep scores in Excel. A reliable importer is often what closes the sale.

### 12.1 Excel upload workflow

```
 1. Download template ──► school-/class-/subject-specific .xlsx with the exact
                          roster pre-filled (admission_no + name locked columns,
                          score columns per assessment component)
 2. Fill offline ──────► teacher enters scores in Excel (works without internet)
 3. Upload ────────────► server parses (SheetJS) in a route handler/worker
 4. VALIDATE ──────────► row-by-row Zod + business rules; build a diff/preview
 5. PREVIEW ───────────► UI shows: ✓ valid rows, ⚠ warnings, ✗ errors w/ reasons,
                          and what will change (old → new) for existing scores
 6. CONFIRM ───────────► user approves; commit in a single transaction (upsert)
 7. RESULT ────────────► summary (imported / skipped / failed) + downloadable
                          error report; full audit + score_history entries
```

### 12.2 Template validation
- Templates are **generated per context** (this class, this subject, this term) so columns and roster are correct and locked — eliminates the #1 import failure (mismatched students/columns).
- Validate: known admission numbers only, scores numeric and within component max, no duplicate rows, required columns present, correct term/class header (hidden metadata cells) to prevent uploading the wrong sheet.

### 12.3 Preview before import
- **Never import blind.** Always show a preview table with per-row status and a clear count of inserts vs updates vs errors. The user explicitly confirms. Existing values about to change are highlighted (old → new).

### 12.4 Rollback strategy
- Commit the whole confirmed batch in **one DB transaction** — all-or-nothing, so a mid-import failure leaves no partial state.
- Record an `import_batch` id on affected rows + in `audit_logs` so an entire import can be reverted in one action ("undo import #1234") if the user later realizes the wrong file was used.

### 12.5 Duplicate prevention
- Upsert on the unique key (`school_id, enrollment_id, class_subject_id, component_id, term_id`) — re-importing updates rather than duplicating. Detect duplicate rows within the file during validation.

### 12.6 Error reporting
- Produce a downloadable annotated copy of the uploaded sheet with an "Error" column per failed row (e.g., "Score 105 exceeds max 60", "Unknown admission no"). Non-technical staff can fix and re-upload. Block import if any **errors** exist; allow proceed-with-warnings for non-blocking issues.

---

## 13. Audit & Logging System

### 13.1 Score change tracking
- DB **trigger on `scores`** writes an immutable `score_history` row on every insert/update (old → new, who, when). Application layer adds a **reason** for post-lock corrections. This is the authoritative "who changed this mark" record — the most-disputed thing in any school system.

### 13.2 Approval tracking
- Every workflow transition writes an `approval_events` row (from→to state, actor, role, comment, timestamp). The full approval lineage of any result is reconstructable.

### 13.3 Activity history
- `audit_logs` captures all sensitive actions across the platform with actor, tenant, entity, metadata, IP, user agent. Per-entity timeline views ("history of this student/result") read from these.

### 13.4 Who changed what and when
- Combine `score_history` + `approval_events` + `audit_logs` into per-entity timelines surfaced in the UI (e.g., a "History" tab on a result showing entries, edits, submissions, approvals, publishes — each attributed).

### 13.5 Rollback concepts
- **Score-level:** restore a prior value from `score_history` (creates a new history entry, never deletes) — audited, reason required.
- **Import-level:** undo an entire `import_batch`.
- **Result-level:** results are recomputable from scores; "rollback" = recompute from a known-good score state, producing a new versioned result. Published corrections re-issue the report card (new QR version). **Nothing is ever silently overwritten.**

> **Principle:** Logs are append-only and tamper-evident. Even Super Admin actions (especially impersonation) are logged. In disputes, the audit trail is the product's credibility.

---

## 14. API & Backend Strategy

### 14.1 API structure
- In-app mutations/queries via **Server Actions** grouped per module (`modules/*/actions.ts`).
- HTTP surface via **Route Handlers** under `app/api` for webhooks, exports, cron, public verification, and a future versioned REST API (`/api/v1/...`) for mobile/integrations.

### 14.2 REST vs Server Actions
- See §7.7. Default Server Actions for the app; Route Handlers for external/streaming/non-browser needs. When you build the public API, version it (`/v1`), authenticate via API keys/JWT, and document with OpenAPI.

### 14.3 Caching strategy
- **Published results are immutable** → cache aggressively (Next.js `unstable_cache`/`revalidateTag`, tag by `school_id`+`term_id`; invalidate on publish/correction).
- Cache slow-changing config (grading systems, school settings, role permissions) per request/short TTL.
- Use Redis (Upstash) for cross-request caches (rate limiting, permission cache, report-job status).
- Static marketing pages fully static; authenticated pages dynamic with targeted caching.

### 14.4 Pagination
- **Cursor (keyset) pagination** for large lists (`WHERE (school_id, id) > ...`) — stable and fast at scale; offset pagination only for small admin lists. Always server-side; default page size ~25–50.

### 14.5 Query optimization
- Select only needed columns; avoid N+1 by batching/joining in repositories; push ranking/aggregation into SQL window functions; lean on the composite indexes from §5.4; `EXPLAIN ANALYZE` the broadsheet and score-sheet queries regularly.

### 14.6 Background jobs
- For heavy work (whole-school recompute, batch PDF generation, bulk import commit, bulk notifications): enqueue and process out-of-band. Options: **Supabase Edge Functions + pg-based queue (pgmq)**, **Supabase Cron**, or a dedicated worker (e.g., a small queue via Upstash QStash / a Node worker on Railway/Fly). Jobs report progress to a `jobs` table the UI polls. Keep request handlers fast.

### 14.7 Cron jobs
- Scheduled tasks via **Supabase pg_cron / scheduled Edge Functions** or host cron hitting `app/api/cron/*` (protected by a secret): nightly logical backups, trial-expiry checks, reminder notifications ("entry closes in 2 days"), cache warmups, cleanup of stale draft imports.

---

## 15. Performance & Scalability

| Lever | Practice |
|-------|----------|
| **Indexing** | Tenant-leading composite indexes (§5.4); partial indexes for soft-delete & `is_current`; window-function-friendly ordering indexes for positions. |
| **Caching** | Immutable published results cached + tag-invalidated; config & permissions cached; Redis for shared caches. |
| **Optimized queries** | Window functions for ranking; batch upserts in the engine; select-only-needed; no N+1. |
| **Server rendering** | Server Components for data-heavy pages (broadsheet, lists) → less client JS, faster on weak devices/networks. Stream with Suspense. |
| **Pagination** | Keyset pagination everywhere lists can grow; never load full rosters client-side. |
| **Lazy loading** | Code-split heavy modules (PDF preview, charts, import wizard) via dynamic import; defer non-critical UI. |
| **Thousands of students/results** | Compute per-batch in memory + bulk upsert; positions in SQL; heavy ops as background jobs with progress; consider partitioning `scores`/`results` by `session_id` later. |
| **Connection management** | Always use Supabase **transaction-mode pooler** from serverless functions; avoid per-request new connections. |
| **Payload size** | Paginate + project columns; compress; avoid shipping computed PDFs through the app server when a signed Storage URL suffices. |

> **Capacity intuition:** A 1,500-student secondary school × ~12 subjects × 3 components ≈ 54,000 score rows/term. Across 1,000 schools that's tens of millions of rows/term — entirely comfortable for a well-indexed Postgres. The bottleneck is rarely raw storage; it's unindexed broadsheet/ranking queries and doing computation row-by-row in request handlers. Index + batch + background-job those, and the system scales smoothly.

---

## 16. Deployment & DevOps

### 16.1 Hosting recommendations
- **App:** Vercel (first-class Next.js: edge middleware, ISR, preview deployments) — or self-host on Railway/Fly/Render if cost or data-residency demands. For African latency, prefer a region/CDN edge close to users (Cloudflare in front helps).
- **DB/Auth/Storage:** Supabase (managed Postgres + Auth + Storage + Edge Functions). Choose the closest region; enable PITR.
- **Background/queues:** Supabase Edge Functions/pg_cron + Upstash (Redis/QStash) as needed.
- **PDF rendering:** a worker capable of headless Chromium (Vercel function with chromium-min, or a dedicated container) — Chromium is heavy, isolate it.

### 16.2 CI/CD
- GitHub + GitHub Actions: on PR → typecheck, lint, unit/integration tests, build, preview deploy. On merge to `main` → run **DB migrations** then deploy app. Migrations are versioned SQL (Supabase CLI) committed to `db/migrations`, applied in CI — **never** click-edit production schema.

### 16.3 Environment structure
- **local** (Supabase local stack via CLI) → **staging** (separate Supabase project + Vercel preview) → **production** (separate Supabase project). Distinct keys/secrets per env in the host's secret store. Seed/anonymized data in staging — never copy real student PII into lower environments.

### 16.4 Backups
- Supabase daily backups + PITR; independent scheduled logical dumps to cold storage; quarterly restore drills (§9.8).

### 16.5 Monitoring
- **Errors:** Sentry (app + edge). **Uptime:** external pinger on `/api/health`. **DB:** Supabase dashboard + slow-query logs + alerts on connection saturation. **Product:** PostHog (privacy-aware) for funnels (onboarding completion, time-to-first-result).

### 16.6 Logging
- Structured JSON logs (request id, school id, user id, action) shipped to a log platform (Logflare/Datadog/Axiom). Correlate with `audit_logs`. Never log secrets or full PII.

### 16.7 Scaling strategy
- App tier scales statelessly/serverlessly. DB scales vertically + read replicas for reporting; pooler for connections; partition hot tables later; tenant-shard mega-tenants if ever needed (§4.7). Put a CDN in front for static + signed-file delivery.

---

## 17. Development Roadmap

> Timelines assume a solo developer initially, ramping to a small team. Calibrate to your pace; the **ordering and dependencies** matter more than the exact weeks.

### Phase 0 — Foundations (Weeks 1–3)
- Repo, CI, env structure, Supabase projects (local/staging/prod), migration tooling.
- Auth + tenancy skeleton: schools, users, roles, permissions, `user_roles`; JWT claims; RLS helper + policies on first tables; middleware tenant/auth guard.
- App shell (shadcn), `DataTable`, `EntityForm`, `authz.can()`.
- **Milestone:** A user can sign up a school, log in, and land on a tenant-isolated dashboard with role-aware nav.

### Phase 1 — Academic setup & people (Weeks 4–7)
- Sessions, terms, classes, subjects, class_subjects, teacher assignment.
- Students + enrollments; staff; guardians; bulk import v1 (students).
- **Milestone:** A school can fully model its structure and roster.

### Phase 2 — Grading & score entry (Weeks 8–11)
- Grading systems + bands; assessment schemes + components.
- ScoreSheet UI (editable grid, autosave, validation, lock-aware) + bulk score import + preview.
- **Milestone:** Teachers can enter/import validated scores for their assigned class-subjects.

### Phase 3 — Result engine & workflow (Weeks 12–16)
- Pure `result-engine` (aggregate/grade/rank/term-aggregate/remarks) with heavy unit tests.
- `ResultService` orchestrator (compute, snapshot, upsert, audit).
- Approval workflow state machine + result locking; `score_history` trigger.
- **Milestone:** Compute a class's results, run them through approval, and lock them — fully audited and reproducible.

### Phase 4 — Reports & MVP launch (Weeks 17–20)
- Report card template(s) + batch PDF (headless Chromium worker); broadsheet PDF/XLSX; watermark.
- Student/parent read-only view; basic notifications (email on publish).
- Hardening: security headers, rate limits, error/loading states, backups verified.
- **Milestone (MVP LAUNCH):** A school goes end-to-end — setup → scores → results → approval → published, printable report cards.

### Phase 5 — Deepening (Weeks 21–30)
- QR verification + configurable templates + signatures + traits/attendance.
- Cumulative/annual results + promotion engine + bulk promotion.
- Bursary fee-gating; subdomains + branding; richer notifications (SMS/WhatsApp).

### Phase 6 — Enterprise & growth (Weeks 31+)
- Self-serve billing/subscriptions; analytics dashboards; public API; mobile app; reseller/white-label.

| Phase | Theme | Outcome |
|-------|-------|---------|
| 0 | Foundations | Tenant + auth + RLS |
| 1 | Academics & people | School modeled |
| 2 | Grading & scores | Scores captured |
| 3 | Engine & workflow | Results computed + approved |
| 4 | Reports | **MVP launch** |
| 5 | Deepening | Sticky, complete product |
| 6 | Enterprise | Scale & monetize |

---

## 18. MVP Implementation Plan

### 18.1 What to build first (and why)
The dependency chain is strict — you cannot compute results without scores, can't enter scores without class-subjects, can't have class-subjects without classes/subjects/terms, can't have any of it without tenancy/auth.

### 18.2 Build order & dependencies

```
[1] Tenancy + Auth + RBAC + RLS        (everything depends on this)
        │
[2] Sessions + Terms                   (time context for all academic data)
        │
[3] Classes + Subjects + ClassSubjects + Teacher assignment
        │
[4] Students + Enrollments  ───────────┐ (Staff in parallel)
        │                              │
[5] Grading systems + Assessment schemes (config the engine needs)
        │                              │
[6] Score entry (sheet + bulk import) ◄┘
        │
[7] Result Engine + ResultService      (the core; needs 5 & 6)
        │
[8] Approval workflow + locking + audit
        │
[9] Report card PDF + broadsheet
        │
[10] Student/Parent view + publish notification
```

### 18.3 What can be postponed (without blocking MVP)
- QR verification, configurable templates, digital signatures → use one solid fixed template first.
- Cumulative/annual + promotion engine → MVP can be single-term; add rollups in Phase 5.
- Attendance, traits, fee-gating, subdomains/branding, SMS/WhatsApp, billing → all Phase 5+.
- Analytics, public API, mobile → enterprise phase.

### 18.4 MVP definition of done
A real pilot school can, unaided after a short walkthrough: set up its structure, onboard students/staff, have teachers enter (or import) scores, compute and approve results, publish, and print correct, branded report cards and a broadsheet — with every score change and approval audited, and zero possibility of seeing another school's data.

---

## 19. Team Structure

### 19.1 Solo developer workflow (now)
- Work **vertically by module** (auth → academics → scores → engine → reports), shipping each end-to-end (schema → repo → service → action → UI → test) before moving on. Resist breadth-first half-finished features.
- Keep a tight migration discipline (every schema change is a committed migration).
- Write engine + RLS tests as you go — they are your safety net when alone.
- Pilot with **one friendly school** early for real feedback; their term calendar is your deadline.

### 19.2 Ideal future team
| Role | Responsibility | When to hire |
|------|----------------|--------------|
| **Founding/Lead engineer (you)** | Architecture, result engine, code review | Now |
| **Full-stack engineer** | Feature modules, UI | When MVP has pilot traction |
| **Frontend/UX engineer** | Score sheet ergonomics, report templates, accessibility | When UX feedback piles up |
| **QA / test engineer (or strong testing culture)** | Engine correctness, e2e, regression | Before scaling to many schools |
| **DevOps/Platform (part-time/fractional)** | CI/CD, backups, monitoring, scaling | Around 50+ schools |
| **Customer success / onboarding** | School setup, training, support | First paying schools |
| **Product/founder** | Roadmap, sales, school relationships | Now (often the founder) |

### 19.3 Responsibilities & ownership
- **Result engine** is owned by the most senior engineer and changes only with tests + review — it's the product's integrity.
- **RLS policies & migrations** require review by a second person once the team exists (a bad RLS change is a breach).
- Customer success owns the onboarding template/checklist and feeds friction back to product.

---

## 20. Testing Strategy

### 20.1 Unit testing
- The **`result-engine` is the highest-priority unit-test target** — it's pure, so test exhaustively: weighting variants, grade boundaries (edge values 39.5/40), tie strategies, absentees, exemptions, empty classes, division-by-zero, rounding. Aim for near-100% coverage here. Also unit-test Zod schemas and `authz.can()`.

### 20.2 Integration testing
- Test services against a **real Postgres with RLS enabled** (Supabase local / Testcontainers): verify tenant isolation (School A truly cannot read School B), repository queries, transactions, triggers (`score_history`), and workflow transitions. RLS tests are non-negotiable.

### 20.3 End-to-end testing
- **Playwright** for the critical journeys: onboard school → set up → enter scores → compute → approve → publish → download report card; bulk import happy + error paths; role-based access (a teacher cannot reach approvals or another teacher's subject). Run in CI against staging.

### 20.4 Result engine testing (special)
- Maintain a **golden-master corpus**: real-ish input sets with hand-verified expected outputs (totals, grades, positions, averages). Any engine change must keep golden tests green — this is how you guarantee a refactor never silently changes a child's grade.
- Property-based tests (fast-check): e.g., "sum of subject totals equals reported total," "positions are a permutation of 1..n with consistent ties."

### 20.5 Security testing
- Automated: RLS isolation tests, authorization tests per role, input fuzzing on imports/forms, dependency scanning (Dependabot), secret scanning, headers/CSP checks.
- Periodic: manual pen-test of auth/tenancy/file-access before scaling; verify signed-URL scoping and that service-role key never reaches the client bundle.

---

## 21. Common Mistakes to Avoid

1. **Hard-coding one grading system.** The fastest way to be unsellable to the next school. Everything graded/weighted/positioned must be data-driven config.
2. **Filtering tenants in app code only (no RLS).** One missing `WHERE school_id` = a cross-tenant breach. Always enforce in the database.
3. **Computing results row-by-row in request handlers.** Times out and overloads the DB. Batch in memory; rank in SQL; background heavy jobs.
4. **Storing only `current_class`, not historical enrollment.** Breaks past results when students move/repeat. Tie results to `enrollments`.
5. **Editing/overwriting scores without history.** Disputes become unwinnable. Append-only `score_history` via trigger.
6. **Mutating grading config in place.** Old report cards stop reproducing. Version config by session and snapshot it on results.
7. **No separation of compute vs publish.** Parents see half-finished results. Keep draft computation invisible until published.
8. **Floats for scores.** Rounding bugs in totals/averages. Use `numeric` and round once at a defined step.
9. **Skipping the approval workflow / locking.** Scores change after report cards print. Lock on submit/approve; corrections are versioned + audited.
10. **Trusting client validation / client-set `school_id` or role.** Always re-validate server-side; derive tenant/role from the JWT, never the request body.
11. **Building breadth-first (many half-done features).** Nothing reaches "a school can actually print a result." Build vertically.
12. **Over-engineering early (microservices, CRDTs, k8s).** A modular monolith on Supabase is correct for years.
13. **Ignoring the offline/low-bandwidth reality.** No Excel import + no autosave = teachers revolt. Make import and drafts first-class.
14. **Loading thousands of rows client-side.** Server pagination + keyset from day one.
15. **No tested backups.** Results are irreplaceable; PITR + drills are mandatory, not optional.
16. **PDFs generated client-side for official docs.** Inconsistent and unprofessional. Server-side headless Chromium.
17. **Designing report cards last.** They're the *visible product* to parents — design the template early; it shapes data you must capture (traits, attendance, remarks).
18. **No audit of admin/super-admin actions.** Especially impersonation. Log everything sensitive.

---

## 22. Final Recommendations

1. **The Result Engine is the product. Protect it.** Keep it pure, deterministic, snapshot-bound, exhaustively unit-tested with golden masters. Every other module is plumbing around it. If the math is ever wrong, the business is over — invest accordingly.

2. **Configurability over features.** Schools differ in grading, weighting, positioning, promotion, and report layout more than they differ in *what* they need. Model these as per-school, per-session **data**, never code. This is your moat and your scalability.

3. **Make the database the security boundary.** RLS on every table, tenant from JWT claims, service-role key strictly server-side. Application checks are defense-in-depth on top — never the only line. Test isolation as a first-class test suite.

4. **Reproducibility and auditability are trust.** Append-only score history, config snapshots on results, immutable approval logs, QR verification. In a dispute, your audit trail is the difference between credibility and chaos — and it's a *sales* feature, not just an engineering one.

5. **Build for the real environment.** Phone-first, low-bandwidth, Excel-friendly, autosave, forgiving UX for non-technical staff, graceful degradation. The most elegant architecture loses to a competitor whose score sheet works on a cheap Android in a classroom with two bars of signal.

6. **Ship the vertical slice, then deepen.** Get one pilot school fully end-to-end (setup → published report card) before adding QR, cumulative, attendance, billing. Real usage will reorder your roadmap better than any plan — including this one.

7. **Stay a modular monolith for years.** Next.js + Supabase + a clean module/service/repository structure scales to thousands of small tenants. Don't add microservices, queues, or k8s until a measured bottleneck forces it. Add Redis/background workers only where you've proven the need (PDF batches, recompute, rate limiting).

8. **Treat onboarding as product.** Time-to-first-result is your key activation metric. Wizards, sensible defaults, grading templates, and bulk import are what turn a trial into a paying, sticky customer. Measure onboarding completion and obsess over reducing it.

9. **Discipline the migrations and environments.** Versioned SQL migrations in CI, three environments, no manual production schema edits, tested PITR backups, anonymized lower-env data. Boring operational rigor is what lets you sleep when 500 schools depend on you during exam season.

10. **Design the report card early.** It's the artifact parents and proprietors judge you by, and it dictates the data you must capture from day one. A beautiful, correct, branded report card sells the whole platform.

---

*End of Master Development Plan v1.0. Treat this as a living document — revise it as pilot feedback and real school workflows reshape the priorities.*
