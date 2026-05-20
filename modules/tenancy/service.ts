import "server-only";
import { err, ok } from "@/lib/errors";
import { tenancyRepository } from "./repository";

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
};
