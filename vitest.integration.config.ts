import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Integration tests (RLS tenant isolation) run against a REAL Postgres, so they
 * live outside the default unit `include`. Run with: `npm run test:rls` after
 * `supabase start` (CI boots one). The suites self-skip unless RLS_TEST=1 and the
 * Supabase env vars are present, so this config is safe to run anywhere.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
      "client-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
    },
  },
});
