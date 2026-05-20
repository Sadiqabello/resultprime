import "server-only";
import { isSuperAdmin, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/utils";
import { authRepository } from "@/modules/auth/repository";
import { platformRepository } from "./repository";
import { createSchoolSchema, type CreateSchoolInput } from "./schema";

export interface SchoolView {
  id: string;
  name: string;
  slug: string;
  status: string;
  tier: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}
export interface AuditView {
  id: string;
  schoolName: string;
  action: string;
  entityType: string | null;
  actorRole: string | null;
  createdAt: string;
}

const VALID_STATUS = ["trial", "active", "suspended", "cancelled"];

export const platformService = {
  async listSchools(ctx: AuthContext): Promise<Result<SchoolView[]>> {
    if (!isSuperAdmin(ctx)) return err("FORBIDDEN", "Super admin only.");
    const { data, error } = await platformRepository.listSchools();
    if (error) return err("INTERNAL", error.message);
    return ok(
      (data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        tier: s.subscription_tier,
        trialEndsAt: s.trial_ends_at,
        createdAt: s.created_at,
      })),
    );
  },

  async createSchool(
    ctx: AuthContext,
    input: CreateSchoolInput,
  ): Promise<Result<{ adminInvited: boolean }>> {
    if (!isSuperAdmin(ctx)) return err("FORBIDDEN", "Super admin only.");
    const parsed = createSchoolSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.");
    const data = parsed.data;

    // Unique slug, retrying on collision.
    const base = slugify(data.name) || "school";
    let schoolId: string | null = null;
    for (let i = 0; i < 4 && !schoolId; i++) {
      const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: school, error } = await platformRepository.insertSchool(data.name, slug);
      if (school) schoolId = school.id as string;
      else if (error && error.code !== "23505") return err("INTERNAL", error.message);
    }
    if (!schoolId) return err("CONFLICT", "Could not generate a unique school address.");

    await platformRepository.insertSettings(schoolId);

    let adminInvited = false;
    if (data.adminEmail) {
      try {
        const user = await authRepository.inviteByEmail(data.adminEmail, schoolId, ["school_admin"]);
        if (user?.id) {
          await authRepository.setClaims(user.id, schoolId, ["school_admin"]);
          const { data: role } = await platformRepository.getSystemRoleId("school_admin");
          if (role?.id) await platformRepository.insertUserRole(user.id, role.id as string, schoolId);
          adminInvited = true;
        }
      } catch (e) {
        logger.warn("platform.school_admin_invite_failed", { schoolId, error: (e as Error).message });
        // School is created; admin can be invited later from the school's Staff page.
      }
    }

    logger.info("platform.school_created", { actorId: ctx.userId, schoolId, adminInvited });
    return ok({ adminInvited });
  },

  async setStatus(ctx: AuthContext, schoolId: string, status: string): Promise<Result<null>> {
    if (!isSuperAdmin(ctx)) return err("FORBIDDEN", "Super admin only.");
    if (!VALID_STATUS.includes(status)) return err("VALIDATION", "Invalid status.");
    const { error } = await platformRepository.setStatus(schoolId, status);
    if (error) return err("INTERNAL", error.message);
    logger.info("platform.school_status", { actorId: ctx.userId, schoolId, status });
    return ok(null);
  },

  async listAudit(ctx: AuthContext, limit = 100): Promise<Result<AuditView[]>> {
    if (!isSuperAdmin(ctx)) return err("FORBIDDEN", "Super admin only.");
    const [{ data: rows, error }, { data: schools }] = await Promise.all([
      platformRepository.listAudit(limit),
      platformRepository.listSchoolNames(),
    ]);
    if (error) return err("INTERNAL", error.message);
    const names = new Map((schools ?? []).map((s) => [s.id, s.name as string]));
    return ok(
      (rows ?? []).map((r) => ({
        id: r.id,
        schoolName: r.school_id ? names.get(r.school_id) ?? "—" : "Platform",
        action: r.action,
        entityType: r.entity_type,
        actorRole: r.actor_role,
        createdAt: r.created_at,
      })),
    );
  },
};
