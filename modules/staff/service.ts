import "server-only";
import { can, type AuthContext, type Role } from "@/lib/authz";
import { requireWritableTenant } from "@/modules/billing/access";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { authRepository } from "@/modules/auth/repository";
import { sendAccountSetupEmail } from "@/modules/auth/service";
import { addStaffSchema, updateStaffSchema, ROLE_LABELS, type AddStaffInput, type UpdateStaffInput } from "./schema";
import { staffRepository } from "./repository";

export interface StaffView {
  id: string;
  fullName: string;
  staffNo: string;
  phone: string | null;
  qualification: string | null;
  isTeaching: boolean;
  status: string;
  hasLogin: boolean;
  roleLabels: string[];
}

export const staffService = {
  async list(ctx: AuthContext): Promise<Result<StaffView[]>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.read")) return err("FORBIDDEN", "Not allowed.");

    const [{ data: staff, error }, { data: userRoles }] = await Promise.all([
      staffRepository.list(ctx.schoolId),
      staffRepository.listUserRoles(ctx.schoolId),
    ]);
    if (error) return err("INTERNAL", error.message);

    // user_id -> [role labels]
    const roleMap = new Map<string, string[]>();
    for (const ur of userRoles ?? []) {
      // Embedded relation may type as object or array under the placeholder schema.
      const rel = ur.roles as { key?: string } | { key?: string }[] | null | undefined;
      const key = (Array.isArray(rel) ? rel[0]?.key : rel?.key) ?? "";
      const label = ROLE_LABELS[key as keyof typeof ROLE_LABELS] ?? key;
      if (!ur.user_id || !label) continue;
      roleMap.set(ur.user_id, [...(roleMap.get(ur.user_id) ?? []), label]);
    }

    return ok(
      (staff ?? []).map((s) => ({
        id: s.id,
        fullName: s.full_name,
        staffNo: s.staff_no,
        phone: s.phone,
        qualification: s.qualification,
        isTeaching: s.is_teaching,
        status: s.status,
        hasLogin: Boolean(s.user_id),
        roleLabels: s.user_id ? roleMap.get(s.user_id) ?? [] : [],
      })),
    );
  },

  /**
   * Add a staff member. If an email is given, invite them as a login user with
   * the chosen role: this writes the role into app_metadata (the JWT claim RLS
   * reads) and records it in user_roles. Rolls back the invited user if the
   * staff row can't be created, so we never orphan an account.
   */
  async add(ctx: AuthContext, input: AddStaffInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.write")) return err("FORBIDDEN", "Not allowed.");
    const _w = await requireWritableTenant(ctx);
    if (!_w.ok) return _w;

    const parsed = addStaffSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid staff details.");
    const data = parsed.data;
    const schoolId = ctx.schoolId;

    // Provision a confirmed login with claims (same path as students/parents) so
    // the branded password-setup email + /auth/confirm → /update-password flow
    // works identically and doesn't depend on Supabase Auth SMTP.
    let userId: string | null = null;
    if (data.email) {
      try {
        const user = await authRepository.createLogin(data.email, schoolId, [data.role as Role]);
        userId = user?.id ?? null;
      } catch (e) {
        const msg = (e as Error).message ?? "";
        const dup = /already|registered|exists/i.test(msg);
        logger.warn("staff.invite_failed", { schoolId, error: msg });
        return dup
          ? err("CONFLICT", "A user with that email already exists.")
          : err("INTERNAL", "Could not create the staff login.");
      }
    }

    const { error } = await staffRepository.insert(schoolId, data, userId);
    if (error) {
      if (userId) await authRepository.deleteUser(userId).catch(() => {});
      if (error.code === "23505") return err("CONFLICT", "That staff number is already in use.");
      return err("INTERNAL", error.message);
    }

    if (userId) {
      const roleId = await staffRepository.getRoleIdByKey(data.role);
      if (roleId) await staffRepository.insertUserRole(userId, roleId, schoolId);
      // Best-effort: email the password-setup link (never blocks staff creation).
      await sendAccountSetupEmail({ email: data.email!, schoolId, roleLabel: ROLE_LABELS[data.role] ?? "staff" });
    }

    logger.info("staff.added", { schoolId, userId, invited: Boolean(data.email) });
    return ok(null);
  },

  /** Re-send the password-setup email to a staff member who already has a login. */
  async resendSetupLink(ctx: AuthContext, id: string): Promise<Result<{ emailSent: boolean }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.write")) return err("FORBIDDEN", "Not allowed.");
    const { data: s } = await staffRepository.get(ctx.schoolId, id);
    if (!s) return err("NOT_FOUND", "Staff not found.");
    if (!s.user_id) return err("VALIDATION", "This staff member has no login — add one with an email first.");
    const email = await authRepository.getUserEmail(s.user_id as string);
    if (!email) return err("INTERNAL", "Couldn't find the login email.");
    const emailSent = await sendAccountSetupEmail({ email, schoolId: ctx.schoolId, roleLabel: "staff" });
    return ok({ emailSent });
  },

  async get(ctx: AuthContext, id: string): Promise<Result<{ id: string; fullName: string; staffNo: string; phone: string | null; qualification: string | null; isTeaching: boolean }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.read")) return err("FORBIDDEN", "Not allowed.");
    const { data: s } = await staffRepository.get(ctx.schoolId, id);
    if (!s) return err("NOT_FOUND", "Staff not found.");
    return ok({
      id: s.id as string,
      fullName: s.full_name as string,
      staffNo: s.staff_no as string,
      phone: (s.phone as string | null) ?? null,
      qualification: (s.qualification as string | null) ?? null,
      isTeaching: Boolean(s.is_teaching),
    });
  },

  async update(ctx: AuthContext, input: UpdateStaffInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.write")) return err("FORBIDDEN", "Not allowed.");
    const _w = await requireWritableTenant(ctx);
    if (!_w.ok) return _w;
    const parsed = updateStaffSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid details.");
    const d = parsed.data;
    const { error } = await staffRepository.update(ctx.schoolId, d.id, {
      full_name: d.fullName,
      phone: d.phone ?? null,
      qualification: d.qualification ?? null,
      is_teaching: d.isTeaching,
    });
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  async remove(ctx: AuthContext, id: string): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "staff.write")) return err("FORBIDDEN", "Not allowed.");
    const _w = await requireWritableTenant(ctx);
    if (!_w.ok) return _w;
    const { error } = await staffRepository.softDelete(ctx.schoolId, id);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },
};
