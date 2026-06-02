/**
 * Subscription pricing (§2.3) — usage-based, per active student.
 *
 * A school pays for a number of student slots, either by the term or by the
 * session (a session = 3 terms, so the session rate is the 3-term price). The
 * paid-for quantity becomes a hard quota enforced when adding students — see
 * `studentCap` below, the check in `modules/students/service.ts`, and the
 * `enforce_student_quota` DB trigger (the authoritative backstop).
 *
 * Amounts are in NGN major units; Paystack is charged in kobo (× 100).
 */
export type BillingPeriod = "term" | "session";

/** Price per student, per billing period (NGN). */
export const PRICE_PER_STUDENT: Record<BillingPeriod, number> = {
  term: 100,
  session: 300,
};

/** How many students a school may add before paying (free 14-day trial).
 *  KEEP IN SYNC with the hardcoded cap in the `enforce_student_quota` trigger. */
export const TRIAL_STUDENT_CAP = 10;

/** Sanity bound on a single checkout's student quantity. */
export const MAX_STUDENTS_PURCHASE = 100_000;

export const isBillingPeriod = (v: unknown): v is BillingPeriod => v === "term" || v === "session";

/** Total charge (NGN) for `quantity` students over one `period`. */
export const priceFor = (period: BillingPeriod, quantity: number): number =>
  PRICE_PER_STUDENT[period] * quantity;

/**
 * The school's active-student cap: what they've paid for, else the trial cap.
 * Pure so it can be unit-tested and shared by the write-time check and UI copy.
 */
export const studentCap = (studentsPaidFor: number | null | undefined): number =>
  studentsPaidFor && studentsPaidFor > 0 ? studentsPaidFor : TRIAL_STUDENT_CAP;
