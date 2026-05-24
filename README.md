# Result Prime — Results, at their prime

Multi-tenant result processing for primary & secondary schools. Built with Next.js (App
Router), TypeScript, shadcn/ui, Tailwind CSS, and Supabase (PostgreSQL / Auth /
Storage).

> Architecture, scope, and rationale live in **[MASTER_DEVELOPMENT_PLAN.md](./MASTER_DEVELOPMENT_PLAN.md)**.
> This README covers running the scaffold.

## Prerequisites

- Node.js ≥ 20 (`nvm use`)
- A Supabase project (cloud) **or** the Supabase CLI for local dev
- npm (or pnpm/bun — adjust commands accordingly)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys (keep secrets here, not in .env.example)

# Database: apply schema + RLS + seed to a local Supabase stack
supabase start               # local Postgres + Studio (needs Docker)
supabase db reset            # applies supabase/migrations/* then supabase/seed.sql
npm run db:types             # regenerate types/database.types.ts from the schema

npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js ESLint |
| `npm run test` | Unit tests (Vitest) — includes the result engine |
| `npm run test:watch` | Vitest watch mode |
| `npm run format` | Prettier |
| `npm run db:types` | Regenerate `types/database.types.ts` from local Supabase |

## Project layout

A modular monolith with DDD boundaries (see §7 of the plan):

```
app/        Next.js routes (thin pages only) — route groups: (public) (auth) (super-admin)
modules/    Domain modules: each owns schema.ts · repository.ts · service.ts · actions.ts
lib/        Shared, framework-agnostic code — incl. lib/result-engine (PURE, no I/O)
components/ shadcn/ui primitives + reusable data-table / forms / layout
supabase/   SQL migrations · RLS policies · triggers · seed (applied by the Supabase CLI)
types/      Generated DB types + shared types
tests/      unit · integration (RLS!) · e2e
config/     env + constants
```

### The layering rule

```
UI (app, components) → Actions → Service → Repository → Postgres (RLS)
                                    ↘ lib/result-engine (pure, deterministic)
```

UI never calls repositories. Actions never embed business logic. Repositories
are the only layer that touches Supabase. The result engine has zero I/O.

## Status

The core is implemented across the layered stack: tenancy, academics, people,
grading, score entry (+ bulk XLSX import), the result engine + orchestrator,
approvals workflow (atomic publish), cumulative/annual rollups, report-card PDFs,
fee-gating, billing (Paystack), and the consumer portal. `lib/result-engine` is
pure and covered by golden **and** property-based tests.

The full database schema, RLS policies, and seed live in `supabase/` and are
verified end-to-end: a CI job boots a real Postgres and runs the RLS
tenant-isolation suite on every PR (`npm run test:rls`), in addition to
typecheck · lint · unit tests · build.

`types/database.types.ts` holds strict, hand-maintained types transcribed from
the migrations, so every repository is type-checked against the real schema.
Regenerate the canonical version whenever the schema changes — it replaces the
file wholesale and is drop-in compatible:

```bash
npm run db:types          # supabase gen types typescript --local   (needs Docker)
npm run db:types:linked   # against a linked cloud project
```

> Dependency note: `@supabase/ssr` 0.5.2 annotates its client with the older
> 3-generic `SupabaseClient`, which the installed `@supabase/supabase-js` (2.106)
> reordered. `lib/supabase/{server,client}.ts` re-annotate the return type so
> queries stay typed; upgrading `@supabase/ssr` to a 2.106-compatible release
> lets you drop those casts.
