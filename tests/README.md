# Tests

| Folder | Scope | Runner |
|--------|-------|--------|
| `unit/` | Pure logic — above all the **result engine** (golden masters, boundaries, ties, edge cases). Highest priority (§20.1, §20.4). | Vitest |
| `integration/` | Services against a **real Postgres with RLS** — verify tenant isolation (School A cannot read School B), triggers, workflow transitions (§20.2). | Vitest + Supabase local |
| `e2e/` | Critical journeys: onboard → scores → compute → approve → publish → report card; bulk import; role-based access (§20.3). | Playwright |

```bash
npm run test        # unit
npm run test:e2e    # playwright (after: npx playwright install)
```

> The result engine is the product's integrity. Treat its tests as
> non-negotiable: any change must keep the golden-master corpus green so a
> refactor can never silently change a child's grade.
