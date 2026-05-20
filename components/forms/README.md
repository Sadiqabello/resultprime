# Form components

Standardized form field wrappers built on **react-hook-form + Zod** (the same
Zod schemas from `modules/*/schema.ts`) and shadcn/ui inputs (§10.3).

Add `shadcn` form primitives here as you build features:

```bash
npx shadcn@latest add form input select textarea checkbox
```

Conventions:
- One Zod schema per concept, reused on client (resolver) and server (action).
- Always re-validate server-side — client validation is UX only.
- Surface field errors inline; use the typed `friendlyMessage()` from
  `lib/errors` for server errors.
