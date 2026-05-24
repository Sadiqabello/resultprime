import "server-only";
import { computeEntitlement } from "@/lib/entitlement";
import { err, ok, type Result } from "@/lib/errors";
import type { AuthContext } from "@/lib/authz";
import { tenancyRepository } from "@/modules/tenancy/repository";

/**
 * Server-side write guard (defence-in-depth for billing). Mutating service
 * methods call this so a tenant whose trial/subscription has lapsed cannot WRITE
 * even by crafting a request — the UI block in the (auth) layout is not enough on
 * its own. Reads are never gated here (read-only tenants keep viewing/exporting).
 *
 * Fails OPEN on a missing/unreadable school (don't break writes on a transient
 * read error); fails CLOSED whenever a school is found and is read-only/locked.
 * Super admins (no tenant) are never gated.
 */
export async function requireWritableTenant(ctx: AuthContext): Promise<Result<null>> {
  if (!ctx.schoolId) return ok(null);
  const { data } = await tenancyRepository.getSchool(ctx.schoolId);
  if (!data) return ok(null);
  const subRow = Array.isArray(data.subscriptions) ? data.subscriptions[0] : data.subscriptions;
  const ent = computeEntitlement({
    status: (data.status as string | null) ?? null,
    trialEndsAt: (data.trial_ends_at as string | null) ?? null,
    subscription: subRow
      ? { status: (subRow.status as string | null) ?? null, currentPeriodEnd: (subRow.current_period_end as string | null) ?? null }
      : null,
  });
  if (ent.access !== "full") {
    return err("FORBIDDEN", ent.reason || "Your school's access is limited — renew your subscription to continue.");
  }
  return ok(null);
}
