# db/

> **Canonical, runnable SQL now lives in [`/supabase`](../supabase)** — that is
> what the Supabase CLI applies (`supabase db reset` / `supabase migration up`)
> and what CI runs against production.

```
supabase/
├── config.toml          Local stack config
├── migrations/          Versioned schema, applied in order
│   ├── ..._extensions_types_functions.sql   extensions, enums, JWT/RLS helpers
│   ├── ..._tenancy_identity.sql             schools, users, roles, permissions
│   ├── ..._academics.sql                    sessions, terms, classes, subjects
│   ├── ..._people.sql                       students, guardians, enrollments, staff
│   ├── ..._grading.sql                      grading systems, bands, schemes, components
│   ├── ..._scores_results.sql               scores, results, term_results, history trigger
│   ├── ..._workflow_audit.sql               approvals, events, audit_logs, notifications
│   └── ..._rls_policies.sql                 RLS enable + policies + lock trigger + grants
└── seed.sql             System roles, permission catalog, role→permission matrix
```

This folder is kept only as a pointer (the conceptual `db/` of the architecture
plan, §7.2). The schema design and rationale are documented in
[`MASTER_DEVELOPMENT_PLAN.md`](../MASTER_DEVELOPMENT_PLAN.md) §5 (database) and §8
(auth/RLS). Don't add SQL here — add a migration:

```bash
supabase migration new <name>
```
