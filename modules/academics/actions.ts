"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { academicsService } from "./service";
import {
  createClassSchema,
  createSessionSchema,
  createSubjectSchema,
  type SaveAssignmentInput,
} from "./schema";

/** Serializable state for the create forms (useActionState). */
export type AcademicsFormState = { ok: true } | { error: string } | null;

// ── create forms ────────────────────────────────────────────────────────────
export async function createSession(
  _prev: AcademicsFormState,
  formData: FormData,
): Promise<AcademicsFormState> {
  const ctx = await requireAuth();
  const parsed = createSessionSchema.safeParse({
    name: formData.get("name"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await academicsService.createSession(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/settings");
  return { ok: true };
}

export async function createClass(
  _prev: AcademicsFormState,
  formData: FormData,
): Promise<AcademicsFormState> {
  const ctx = await requireAuth();
  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    arm: formData.get("arm"),
    gradeOrder: formData.get("gradeOrder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await academicsService.createClass(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/classes");
  return { ok: true };
}

export async function createSubject(
  _prev: AcademicsFormState,
  formData: FormData,
): Promise<AcademicsFormState> {
  const ctx = await requireAuth();
  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    category: formData.get("category"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await academicsService.createSubject(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/subjects");
  return { ok: true };
}

// ── button form-actions (no client state needed) ─────────────────────────────
export async function setCurrentSession(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const id = String(formData.get("id"));
  await academicsService.setCurrentSession(ctx, id);
  revalidatePath("/settings");
}

export async function setCurrentTerm(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const id = String(formData.get("id"));
  await academicsService.setCurrentTerm(ctx, id);
  revalidatePath("/settings");
}

export async function deleteClass(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await academicsService.removeClass(ctx, String(formData.get("id")));
  revalidatePath("/classes");
}

export async function deleteSubject(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await academicsService.removeSubject(ctx, String(formData.get("id")));
  revalidatePath("/subjects");
}

/** Save a class's subject offerings + teachers (called with a structured object). */
export async function saveClassAssignment(
  input: SaveAssignmentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requireAuth();
  const res = await academicsService.saveClassAssignment(ctx, input);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath(`/classes/${input.classId}`);
  return { ok: true };
}
