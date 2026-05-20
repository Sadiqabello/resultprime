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
