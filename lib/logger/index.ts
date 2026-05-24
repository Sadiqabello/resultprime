/**
 * Minimal structured logger. Emits JSON so it correlates cleanly in a log
 * platform (Logflare/Axiom/Datadog). Always include request/tenant/actor ids
 * where available. NEVER log secrets or full PII.
 *
 * Swap the transport (e.g. pino, or ship to Sentry) without changing callers.
 */
type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  schoolId?: string | null;
  userId?: string | null;
  action?: string;
  [key: string]: unknown;
}

function emit(level: Level, message: string, fields?: LogFields) {
  const entry = { level, message, ts: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, f?: LogFields) => emit("debug", msg, f),
  info: (msg: string, f?: LogFields) => emit("info", msg, f),
  warn: (msg: string, f?: LogFields) => emit("warn", msg, f),
  error: (msg: string, f?: LogFields) => emit("error", msg, f),
};

/**
 * Report an unexpected exception. The single place that ships errors off-box:
 * it always emits a structured error log, and forwards to an error tracker when
 * one is wired. Used by the Next `onRequestError` instrumentation hook and
 * ad-hoc catch sites.
 *
 * Sentry forwarding is dependency-free until you opt in: set SENTRY_DSN and
 * `npm i @sentry/nextjs`. The import is dynamic + guarded, so builds/tests don't
 * require the package, and nothing changes for callers.
 */
export function captureException(error: unknown, fields?: LogFields) {
  const e = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
  emit("error", e.message, { ...fields, errorName: e.name, stack: e.stack });

  if (process.env.SENTRY_DSN) {
    // webpackIgnore keeps the bundler from resolving (and requiring) the package
    // at build time — it's only imported at runtime once you install it.
    import(/* webpackIgnore: true */ "@sentry/nextjs")
      .then((Sentry: { captureException?: (err: unknown, ctx?: unknown) => void }) => {
        Sentry.captureException?.(e, { extra: fields });
      })
      .catch(() => {
        // @sentry/nextjs not installed yet — the structured log above still fired.
      });
  }
}
