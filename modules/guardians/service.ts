import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { authRepository } from "@/modules/auth/repository";
import { sendAccountSetupEmail } from "@/modules/auth/service";
import { addGuardianSchema, type AddGuardianInput } from "./schema";
import { guardiansRepository } from "./repository";

export interface GuardianView {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  isPrimary: boolean;
  hasLogin: boolean;
}

export const guardiansService = {
  async listForStudent(ctx: AuthContext, studentId: string): Promise<Result<GuardianView[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "students.read")) return err("FORBIDDEN", "Not allowed.");
    const { guardians, links } = await guardiansRepository.listForStudent(ctx.schoolId, studentId);
    const linkBy = new Map(links.map((l) => [l.guardian_id, l]));
    return ok(
      guardians.map((g) => {
        const l = linkBy.get(g.id);
        return {
          id: g.id as string,
          fullName: g.full_name as string,
          email: (g.email as string | null) ?? null,
          phone: (g.phone as string | null) ?? null,
          relationship: (l?.relationship as string | null) ?? null,
          isPrimary: Boolean(l?.is_primary),
          hasLogin: Boolean(g.user_id),
        };
      }),
    );
  },

  /** Create a guardian, link to the student, optionally provision a parent login. */
  async add(ctx: AuthContext, input: AddGuardianInput): Promise<Result<{ loginCreated: boolean; emailSent: boolean }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const parsed = addGuardianSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid guardian details.");
    const d = parsed.data;

    const { data: guardian, error } = await guardiansRepository.insertGuardian(schoolId, {
      full_name: d.fullName,
      email: d.email,
      phone: d.phone,
    });
    if (error || !guardian) return err("INTERNAL", error?.message ?? "Could not add guardian.");
    const guardianId = guardian.id as string;

    const { error: linkErr } = await guardiansRepository.link(schoolId, d.studentId, guardianId, d.relationship ?? null, d.isPrimary);
    if (linkErr) return err("INTERNAL", linkErr.message);

    let loginCreated = false;
    let emailSent = false;
    if (d.createLogin && d.email) {
      try {
        const user = await authRepository.createLogin(d.email, schoolId, ["parent"]);
        if (user) {
          await guardiansRepository.setUserId(schoolId, guardianId, user.id);
          loginCreated = true;
          emailSent = await sendAccountSetupEmail({ email: d.email, schoolId, roleLabel: "parent" });
        }
      } catch (e) {
        // Guardian + link are saved; surface that the login wasn't created.
        logger.warn("guardians.login_failed", { schoolId, error: (e as Error).message });
      }
    }

    await auditService.record({ schoolId, actorId: ctx.userId, action: "guardian.add", entityType: "student", entityId: d.studentId, metadata: { guardianId, loginCreated } });
    return ok({ loginCreated, emailSent });
  },

  /** Re-send the password-setup email to a guardian (parent) who already has a login. */
  async resendSetupLink(ctx: AuthContext, guardianId: string): Promise<Result<{ emailSent: boolean }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const { data: g } = await guardiansRepository.getById(ctx.schoolId, guardianId);
    if (!g) return err("NOT_FOUND", "Guardian not found.");
    if (!g.user_id) return err("VALIDATION", "This parent has no login yet.");
    const email = (g.email as string | null) ?? (await authRepository.getUserEmail(g.user_id as string));
    if (!email) return err("INTERNAL", "Couldn't find the login email.");
    const emailSent = await sendAccountSetupEmail({ email, schoolId: ctx.schoolId, roleLabel: "parent" });
    await auditService.record({ schoolId: ctx.schoolId, actorId: ctx.userId, action: "guardian.setup_link_resent", entityType: "student", entityId: guardianId });
    return ok({ emailSent });
  },
};
