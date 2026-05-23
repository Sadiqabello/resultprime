import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getEmailTransport, renderAccountInvite } from "@/lib/delivery";
import type { AuthContext } from "@/lib/authz";
import type { Role } from "@/lib/authz";
import { authRepository } from "./repository";
import type { RegisterSchoolInput } from "./schema";

/**
 * Resolve the current AuthContext from the validated session. Tenant and roles
 * come from the JWT's app_metadata (set server-side at provisioning / role
 * change) — NEVER from user_metadata or request input, which users can edit.
 *
 * Returns null when unauthenticated; callers (layouts/actions) redirect.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appMeta = (user.app_metadata ?? {}) as {
    school_id?: string;
    roles?: string[];
  };

  return {
    userId: user.id,
    schoolId: appMeta.school_id ?? null,
    roles: (appMeta.roles ?? []) as Role[],
  };
}

/** Require an authenticated context or throw — for use inside server actions. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  return ctx;
}

/**
 * Provision a new tenant: create the school + settings, create the admin auth
 * user (email auto-confirmed), set the JWT claims that RLS depends on
 * (app_metadata.school_id + roles), and link the school_admin role.
 *
 * Uses the SERVICE-ROLE client because at signup the caller has no school_id
 * claim yet, so RLS would (correctly) block creating a school. This is the one
 * sanctioned cross-tenant provisioning path (§8). Best-effort rolls back the
 * school if user creation fails so we don't leave an orphan tenant.
 */
export async function registerSchoolAndAdmin(
  input: RegisterSchoolInput,
): Promise<Result<{ schoolId: string }>> {
  const admin = createAdminClient();
  const base = slugify(input.schoolName) || "school";

  // 1. create the school, retrying the slug on collision (unique constraint).
  let schoolId: string | null = null;
  for (let attempt = 0; attempt < 4 && !schoolId; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await admin
      .from("schools")
      .insert({ name: input.schoolName, slug, status: "trial" })
      .select("id")
      .single();
    if (data) schoolId = data.id as string;
    else if (error && error.code !== "23505") {
      // Not a slug collision (23505) — a real failure. Log the cause; the slug
      // retry loop only retries collisions, so we stop here.
      logger.error("auth.register.school_insert_failed", { code: error.code, error: error.message });
      return err("INTERNAL", error.message);
    }
  }
  if (!schoolId) {
    return err("CONFLICT", "Could not generate a unique school address — try a different name.");
  }

  await admin.from("school_settings").insert({ school_id: schoolId });

  // 2. create the admin user with claims baked in (email_confirm skips the email step).
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, school_id: schoolId },
    app_metadata: { school_id: schoolId, roles: ["school_admin"] },
  });

  if (userErr || !created?.user) {
    // roll back the orphan tenant
    await admin.from("school_settings").delete().eq("school_id", schoolId);
    await admin.from("schools").delete().eq("id", schoolId);
    const duplicate =
      userErr?.status === 422 || /already|exists|registered/i.test(userErr?.message ?? "");
    logger.warn("auth.register.user_failed", { schoolId, error: userErr?.message });
    return duplicate
      ? err("CONFLICT", "An account with that email already exists.")
      : err("INTERNAL", userErr?.message ?? "Could not create the account.");
  }

  // 3. link the school_admin system role (the handle_new_user trigger already
  //    created the public.users row from user_metadata).
  const { data: role } = await admin
    .from("roles")
    .select("id")
    .is("school_id", null)
    .eq("key", "school_admin")
    .maybeSingle();
  if (role) {
    await admin
      .from("user_roles")
      .insert({ user_id: created.user.id, role_id: role.id, school_id: schoolId });
  }

  logger.info("auth.register.success", { schoolId, userId: created.user.id });
  return ok({ schoolId });
}

/**
 * Best-effort: email a password-setup link to a freshly provisioned login
 * (student / parent / staff). Uses our own email transport — Resend when its
 * keys are set, otherwise the dev log transport (which records the link so you
 * can complete the flow locally without paid keys). Never throws; returns
 * `true` only when a LIVE provider actually dispatched the email, so callers can
 * tell families "check your inbox" vs "ask your school for the link".
 */
export async function sendAccountSetupEmail(input: {
  email: string;
  schoolId: string;
  roleLabel: string;
}): Promise<boolean> {
  try {
    const token = await authRepository.generateRecoveryToken(input.email);
    if (!token) return false;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const setupUrl =
      `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(token)}` +
      `&type=recovery&next=${encodeURIComponent("/update-password")}`;

    // Friendlier email: include the school's name (admin client — no user ctx here).
    const admin = createAdminClient();
    const { data: school } = await admin
      .from("schools")
      .select("name")
      .eq("id", input.schoolId)
      .maybeSingle();
    const schoolName = (school?.name as string | undefined) ?? "your school";

    const transport = getEmailTransport();
    const { subject, text, html } = renderAccountInvite({
      schoolName,
      roleLabel: input.roleLabel,
      setupUrl,
    });
    const res = await transport.send({ to: input.email, subject, text, html });
    if (!res.ok) {
      logger.warn("auth.setup_email_failed", { schoolId: input.schoolId, error: res.error });
      return false;
    }
    // The log transport "succeeds" without delivering — only report a real send.
    return transport.name !== "log";
  } catch (e) {
    logger.warn("auth.setup_email_error", { schoolId: input.schoolId, error: (e as Error).message });
    return false;
  }
}
