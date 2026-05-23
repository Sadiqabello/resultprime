"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import type { ResendState } from "@/components/ui/resend-setup-button";
import { guardiansService } from "./service";
import { addGuardianSchema } from "./schema";

export async function resendGuardianSetup(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const ctx = await requireAuth();
  const res = await guardiansService.resendSetupLink(ctx, String(formData.get("id")));
  if (!res.ok) return { error: friendlyMessage(res.error) };
  return {
    ok: true,
    message: res.data.emailSent ? "Setup link sent." : "Couldn't email it — set RESEND_API_KEY to send links.",
  };
}

export type GuardianFormState = { ok: true; loginCreated: boolean; emailSent: boolean } | { error: string } | null;

export async function addGuardian(_prev: GuardianFormState, formData: FormData): Promise<GuardianFormState> {
  const ctx = await requireAuth();
  const parsed = addGuardianSchema.safeParse({
    studentId: formData.get("studentId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    relationship: formData.get("relationship"),
    isPrimary: formData.get("isPrimary") === "on",
    createLogin: formData.get("createLogin") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await guardiansService.add(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath(`/students/${parsed.data.studentId}`);
  return { ok: true, loginCreated: res.data.loginCreated, emailSent: res.data.emailSent };
}
