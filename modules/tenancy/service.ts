import "server-only";
import { err, ok, type Result } from "@/lib/errors";
import type { AuthContext } from "@/lib/authz";
import { tenancyRepository } from "./repository";

export interface CurrentSchool {
  name: string;
  status: string;
  /** Active access? false when suspended/cancelled. */
  accessible: boolean;
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

  async getSettings(schoolId: string) {
    const { data, error } = await tenancyRepository.getSettings(schoolId);
    if (error) return err("INTERNAL", error.message);
    return ok(data);
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
    return ok({
      name: data.name as string,
      status,
      accessible: status !== "suspended" && status !== "cancelled",
    });
  },
};
