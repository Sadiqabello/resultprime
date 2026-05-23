"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { signInSchema, registerSchoolSchema } from "./schema";
import { getAuthContext, registerSchoolAndAdmin } from "./service";

/**
 * Plain, serializable state for useActionState in the client forms. (We return
 * a simple object rather than the service-layer Result/AppError, since class
 * instances don't serialize reliably across the server-action boundary.)
 */
export type AuthFormState = { error: string } | null;

/** Sign in an existing user. On success, cookies are set and we redirect. */
export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password." };

  // Honour an explicit (safe) redirect; otherwise route by role.
  const requested = formData.get("redirectTo");
  if (typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")) {
    redirect(requested);
  }
  const ctx = await getAuthContext();
  const consumerOnly =
    !!ctx && ctx.roles.length > 0 && ctx.roles.every((r) => r === "student" || r === "parent");
  redirect(consumerOnly ? "/portal" : "/dashboard");
}

/** Register a new school + first admin, then sign them in. */
export async function registerSchool(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchoolSchema.safeParse({
    schoolName: formData.get("schoolName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  // Wrap only the provisioning (NOT the redirect below — redirect() throws a
  // control-flow signal that must propagate). An unexpected throw here (e.g.
  // the admin client failing because env vars weren't loaded) otherwise becomes
  // an opaque error; log the real cause and show the friendly message.
  let result: Awaited<ReturnType<typeof registerSchoolAndAdmin>>;
  try {
    result = await registerSchoolAndAdmin(parsed.data);
  } catch (e) {
    logger.error("auth.register.unexpected", { error: (e as Error).message });
    return { error: "Something went wrong. Please try again." };
  }
  if (!result.ok) return { error: friendlyMessage(result.error) };

  // Establish the session for the freshly-created admin.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Your school was created — please sign in." };

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
