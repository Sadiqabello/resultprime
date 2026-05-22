"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { guardiansService } from "./service";
import { addGuardianSchema } from "./schema";

export type GuardianFormState = { ok: true; loginCreated: boolean } | { error: string } | null;

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
  return { ok: true, loginCreated: res.data.loginCreated };
}
