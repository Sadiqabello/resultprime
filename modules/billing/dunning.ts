import "server-only";
import { computeEntitlement, type Entitlement } from "@/lib/entitlement";
import { getEmailTransport, renderBillingReminder } from "@/lib/delivery";
import { logger } from "@/lib/logger";
import { billingRepository } from "./repository";

const DAY = 86_400_000;

/**
 * Decide whether a school gets a reminder today, and what it says. Fires on a
 * fixed day-schedule so a *daily* run sends each reminder at most once (no need
 * for a sent-log): pre-expiry at 3 & 1 days left; in read-only grace at 5 & 2
 * days left. Locked schools aren't emailed (they see the renew screen on sign-in).
 */
function reminderFor(ent: Entitlement, schoolName: string, now: Date): { heading: string; lede: string; note?: string } | null {
  const t = now.getTime();
  if (ent.access === "full" && ent.until) {
    const daysLeft = Math.ceil((Date.parse(ent.until) - t) / DAY);
    if (daysLeft === 3 || daysLeft === 1) {
      const isTrial = ent.state === "trial";
      const d = `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
      return {
        heading: isTrial ? "Your free trial ends soon" : "Your subscription is expiring soon",
        lede: `${schoolName}'s ${isTrial ? "free trial" : "subscription"} ends in ${d}. Renew now to keep full access to results, report cards and parent portals — without interruption.`,
      };
    }
  }
  if (ent.access === "read_only" && ent.until) {
    const graceLeft = Math.ceil((Date.parse(ent.until) - t) / DAY);
    if (graceLeft === 5 || graceLeft === 2) {
      const d = `${graceLeft} days`;
      return {
        heading: ent.state === "trial_expired" ? "Your trial has ended — read-only access" : "Payment overdue — read-only access",
        lede: `${schoolName} is now read-only: you can still view and export records, but editing is paused. Subscribe within ${d} to restore full access.`,
        note: "After the grace period, the workspace is locked until you renew. Your data is never deleted.",
      };
    }
  }
  return null;
}

/**
 * Send due billing reminders across all tenants (service-role, cross-tenant).
 * Best-effort — never throws per-school. Locking itself is computed live, so this
 * job only nudges; it isn't required for access control.
 */
export async function runDunning(now: Date = new Date()): Promise<{ scanned: number; sent: number }> {
  const { data: schools, error } = await billingRepository.listForDunning();
  if (error) {
    logger.error("billing.dunning_query_failed", { error: error.message });
    return { scanned: 0, sent: 0 };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const transport = getEmailTransport();
  let sent = 0;

  for (const s of schools ?? []) {
    const email = s.email as string | null;
    if (!email) continue;
    const subRow = Array.isArray(s.subscriptions) ? s.subscriptions[0] : s.subscriptions;
    const ent = computeEntitlement(
      {
        status: (s.status as string | null) ?? null,
        trialEndsAt: (s.trial_ends_at as string | null) ?? null,
        subscription: subRow
          ? { status: (subRow.status as string | null) ?? null, currentPeriodEnd: (subRow.current_period_end as string | null) ?? null }
          : null,
      },
      now,
    );
    const msg = reminderFor(ent, s.name as string, now);
    if (!msg) continue;
    try {
      const r = renderBillingReminder({ schoolName: s.name as string, appUrl, ...msg });
      const res = await transport.send({ to: email, subject: r.subject, text: r.text, html: r.html });
      if (res.ok && transport.name !== "log") sent++;
    } catch (e) {
      logger.warn("billing.dunning_send_failed", { schoolId: s.id, error: (e as Error).message });
    }
  }
  logger.info("billing.dunning_run", { scanned: schools?.length ?? 0, sent });
  return { scanned: schools?.length ?? 0, sent };
}
