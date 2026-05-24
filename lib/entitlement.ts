/**
 * Tenant access entitlement (§2.3 — billing access control).
 *
 * Computed LIVE from the school's status + trial/subscription dates, so access
 * locks and unlocks the moment a trial or subscription lapses or a payment lands
 * — no cron job is required to "lock" an account (a daily job only sends
 * reminders). Pure & deterministic so it can be unit-tested and reused by the
 * UI gate, the server-side write guard, and the dunning job.
 *
 *   full       → normal use.
 *   read_only  → trial/subscription has lapsed but is within the grace window:
 *                everything is viewable/exportable, but writes are blocked.
 *   locked     → past grace, or manually suspended/cancelled: no app access
 *                (the renew/checkout flow is still reachable).
 */
export type AccessLevel = "full" | "read_only" | "locked";

export type EntitlementState =
  | "subscribed"
  | "trial"
  | "trial_expired"
  | "past_due"
  | "suspended"
  | "cancelled";

export interface Entitlement {
  access: AccessLevel;
  state: EntitlementState;
  /** When the current access window ends (period end, or grace end). null = open-ended. */
  until: string | null;
  /** Short, user-facing explanation. */
  reason: string;
}

export interface EntitlementInput {
  /** schools.status — "trial" | "active" | "suspended" | "cancelled". */
  status: string | null | undefined;
  /** schools.trial_ends_at (ISO). */
  trialEndsAt: string | null | undefined;
  /** The school's subscription, if any. */
  subscription: { status: string | null | undefined; currentPeriodEnd: string | null | undefined } | null | undefined;
}

/** Days of read-only grace after a trial/subscription lapses before a hard lock. */
export const GRACE_DAYS = 7;

const DAY = 86_400_000;
const parse = (d: string | null | undefined): number | null => {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : t;
};

export function computeEntitlement(input: EntitlementInput, now: Date = new Date()): Entitlement {
  const t = now.getTime();
  const status = input.status ?? "trial";

  // 1. Manual super-admin actions are an immediate hard lock.
  if (status === "suspended") {
    return { access: "locked", state: "suspended", until: null, reason: "This school's access has been suspended." };
  }
  if (status === "cancelled") {
    return { access: "locked", state: "cancelled", until: null, reason: "This school's subscription has been cancelled." };
  }

  const periodEnd = parse(input.subscription?.currentPeriodEnd);
  const trialEnd = parse(input.trialEndsAt);
  const hasSub = periodEnd != null;

  // 2. The date access is paid/trialled through: subscription wins over trial.
  const entitledUntil = hasSub ? periodEnd : trialEnd;
  const baseState: EntitlementState = hasSub ? "subscribed" : "trial";
  const lapsedState: EntitlementState = hasSub ? "past_due" : "trial_expired";

  // 3. Legacy / open-ended (no trial end recorded, no subscription) — don't lock.
  if (entitledUntil == null) {
    return { access: "full", state: baseState, until: null, reason: "" };
  }

  // 4. Within the paid/trial window.
  if (t <= entitledUntil) {
    return {
      access: "full",
      state: baseState,
      until: new Date(entitledUntil).toISOString(),
      reason: "",
    };
  }

  // 5. Lapsed — read-only during grace, then hard lock.
  const graceEnd = entitledUntil + GRACE_DAYS * DAY;
  if (t <= graceEnd) {
    return {
      access: "read_only",
      state: lapsedState,
      until: new Date(graceEnd).toISOString(),
      reason: hasSub
        ? "Your subscription payment is overdue. Renew now to keep full access."
        : "Your free trial has ended. Subscribe now to keep full access.",
    };
  }
  return {
    access: "locked",
    state: lapsedState,
    until: null,
    reason: hasSub
      ? "Your subscription has lapsed. Renew to restore access."
      : "Your free trial has ended. Subscribe to restore access.",
  };
}
