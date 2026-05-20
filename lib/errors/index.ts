/**
 * Typed error model. Services return a `Result<T>` for *expected* failures
 * (validation, permission, not-found) instead of throwing, so callers handle
 * them explicitly. Throw only for truly exceptional states.
 */

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "TENANT_MISMATCH"
  | "RESULT_LOCKED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = (
  code: AppErrorCode,
  message: string,
  details?: unknown,
): Err => ({ ok: false, error: new AppError(code, message, details) });

/** Map an error code to a user-friendly, non-technical message for the UI. */
export function friendlyMessage(error: AppError): string {
  switch (error.code) {
    case "UNAUTHENTICATED":
      return "Please sign in to continue.";
    case "FORBIDDEN":
      return "You don't have permission to do that.";
    case "NOT_FOUND":
      return "We couldn't find what you were looking for.";
    case "VALIDATION":
      return error.message || "Some details are missing or invalid.";
    case "CONFLICT":
      return error.message || "That action conflicts with existing data.";
    case "TENANT_MISMATCH":
      return "This resource belongs to a different school.";
    case "RESULT_LOCKED":
      return "These results are locked and cannot be changed.";
    default:
      return "Something went wrong. Please try again.";
  }
}
