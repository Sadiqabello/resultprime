import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { requireWritableTenant } from "@/modules/billing/access";
import { err, ok, type Result } from "@/lib/errors";
import { computeEntitlement, type Entitlement } from "@/lib/entitlement";
import { schoolSettingsSchema, type SchoolSettingsInput } from "./schema";
import { tenancyRepository } from "./repository";

export interface CurrentSchool {
  name: string;
  slug: string;
  status: string;
  /** Active access? false when suspended/cancelled (kept for back-compat). */
  accessible: boolean;
  /** Live billing entitlement (trial/subscription + grace). */
  entitlement: Entitlement;
}

export interface PublicBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface BrandingView {
  schoolName: string;
  logoUrl: string;
  principalSignatureUrl: string;
  primaryColor: string;
  secondaryColor: string;
  approvalPolicy: "one_step" | "two_step";
  feeGatingEnabled: boolean;
}

/**
 * Tenant resolution & settings. `resolveBySlug` is the bridge from a subdomain
 * to a school_id (Phase 2); the result MUST still be reconciled against the
 * JWT's school_id before trusting it for authenticated requests (§4.4).
 */
export const tenancyService = {
  async resolveBySlug(slug: string) {
    const { data, error } = await tenancyRepository.getBySlug(slug);
    if (error || !data) return err("NOT_FOUND", "Unknown school.");
    return ok(data);
  },

  /** Public branding for a subdomain's login page (no auth). Null if unknown. */
  async resolvePublicBranding(slug: string): Promise<PublicBranding | null> {
    const row = await tenancyRepository.getPublicBySlug(slug);
    if (!row || row.status === "suspended" || row.status === "cancelled") return null;
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      logoUrl: (row.logo_url as string | null) ?? null,
      primaryColor: (row.primary_color as string | null) ?? null,
    };
  },

  async getSettings(schoolId: string) {
    const { data, error } = await tenancyRepository.getSettings(schoolId);
    if (error) return err("INTERNAL", error.message);
    return ok(data);
  },

  /** Current branding + policy for the settings form. */
  async getBranding(ctx: AuthContext): Promise<Result<BrandingView>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const [{ data: school }, { data: settings }] = await Promise.all([
      tenancyRepository.getSchool(ctx.schoolId),
      tenancyRepository.getSettings(ctx.schoolId),
    ]);
    return ok({
      schoolName: (school?.name as string) ?? "",
      logoUrl: (settings?.logo_url as string | null) ?? "",
      principalSignatureUrl: (settings?.principal_signature_url as string | null) ?? "",
      primaryColor: (settings?.primary_color as string | null) ?? "#606c38",
      secondaryColor: (settings?.secondary_color as string | null) ?? "#283618",
      approvalPolicy: (settings?.approval_policy as "one_step" | "two_step" | null) ?? "one_step",
      feeGatingEnabled: Boolean(settings?.fee_gating_enabled),
    });
  },

  /** Persist branding + policy. School Admin only (also enforced by RLS). */
  async saveBranding(ctx: AuthContext, input: SchoolSettingsInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "school.configure")) return err("FORBIDDEN", "Not allowed.");
    const _w = await requireWritableTenant(ctx);
    if (!_w.ok) return _w;

    const parsed = schoolSettingsSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid settings.");
    const d = parsed.data;

    if (d.schoolName) {
      const { error } = await tenancyRepository.updateSchoolName(ctx.schoolId, d.schoolName);
      if (error) return err("INTERNAL", error.message);
    }

    const { error } = await tenancyRepository.upsertSettings(ctx.schoolId, {
      logo_url: d.logoUrl ?? null,
      principal_signature_url: d.principalSignatureUrl ?? null,
      primary_color: d.primaryColor ?? null,
      secondary_color: d.secondaryColor ?? null,
      timezone: d.timezone,
      locale: d.locale,
      approval_policy: d.approvalPolicy,
      fee_gating_enabled: d.feeGatingEnabled,
    });
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  /**
   * Resolve the current user's school + whether it may be accessed. Used by the
   * (auth) layout to gate suspended/cancelled tenants out of the whole app.
   */
  async getCurrentSchool(ctx: AuthContext): Promise<Result<CurrentSchool | null>> {
    if (!ctx.schoolId) return ok(null); // platform super admin — no tenant
    const { data, error } = await tenancyRepository.getSchool(ctx.schoolId);
    if (error) return err("INTERNAL", error.message);
    if (!data) return ok(null);
    const status = data.status as string;
    // PostgREST embeds the (one) subscription as an array.
    const subRow = Array.isArray(data.subscriptions) ? data.subscriptions[0] : data.subscriptions;
    const entitlement = computeEntitlement({
      status,
      trialEndsAt: (data.trial_ends_at as string | null) ?? null,
      subscription: subRow
        ? { status: (subRow.status as string | null) ?? null, currentPeriodEnd: (subRow.current_period_end as string | null) ?? null }
        : null,
    });
    return ok({
      name: data.name as string,
      slug: (data.slug as string) ?? "",
      status,
      accessible: entitlement.access !== "locked",
      entitlement,
    });
  },
};
