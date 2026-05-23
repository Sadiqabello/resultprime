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

Foundational scaffold. Modules contain typed stubs (`schema/repository/service/
actions`) ready to be filled in, following the build order in §18 of the plan.
The `lib/result-engine` is partially implemented and unit-tested as the
reference for the layered pattern.

The full database schema, RLS policies, and seed exist in `supabase/` and have
been verified end-to-end (migrations apply, tenant isolation + score-locking +
history triggers enforced). After `supabase db reset`, run `npm run db:types` to
replace the placeholder `types/database.types.ts` with strict generated types —
the repositories will then be type-checked against the real schema.
