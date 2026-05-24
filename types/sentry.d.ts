/**
 * Minimal ambient declaration for the optional `@sentry/nextjs` dependency.
 *
 * Error tracking is opt-in: `lib/logger#captureException` forwards to Sentry via
 * a guarded, `webpackIgnore` dynamic import only when SENTRY_DSN is set. This stub
 * lets `tsc` and `next build` type-check without the package installed; once you
 * `npm i @sentry/nextjs`, its own types take precedence.
 */
declare module "@sentry/nextjs" {
  export function captureException(error: unknown, context?: unknown): string;
}
