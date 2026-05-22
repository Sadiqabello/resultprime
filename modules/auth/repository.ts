import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/authz";

/**
 * Provisioning operations that require the service-role client (setting JWT
 * claims, inviting users). Used by School Admin / Super Admin flows — always
 * audited by the caller.
 */
export const authRepository = {
  /**
   * Write tenant + roles into a user's app_metadata so they appear in the JWT.
   * app_metadata is not user-editable — this is the trust anchor for RBAC/RLS.
   */
  async setClaims(userId: string, schoolId: string | null, roles: Role[]) {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { school_id: schoolId, roles },
    });
    if (error) throw error;
  },

  async inviteByEmail(email: string, schoolId: string, roles: Role[]) {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { school_id: schoolId, roles },
    });
    if (error) throw error;
    return data.user;
  },

  /**
   * Create a confirmed login with claims and a random temp password — used to
   * provision student/parent accounts without depending on email delivery. They
   * sign in via a password reset / invite link once email is configured. The
   * claims (school_id + roles) are the trust anchor for RLS.
   */
  async createLogin(email: string, schoolId: string, roles: Role[]) {
    const admin = createAdminClient();
    const password = `${crypto.randomUUID()}Aa1!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { school_id: schoolId, roles },
      user_metadata: { school_id: schoolId },
    });
    if (error) throw error;
    return data.user;
  },

  /** Best-effort cleanup of a just-provisioned user when a later step fails. */
  async deleteUser(userId: string) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId);
  },
};
