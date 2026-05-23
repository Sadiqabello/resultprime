"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { can } from "@/lib/authz";
import { uploadImage } from "@/lib/storage";
import type { ResendState } from "@/components/ui/resend-setup-button";
import { studentsService } from "./service";
import { createStudentSchema, updateStudentSchema } from "./schema";

export async function resendStudentSetup(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const ctx = await requireAuth();
  const res = await studentsService.resendSetupLink(ctx, String(formData.get("id")));
  if (!res.ok) return { error: friendlyMessage(res.error) };
  return {
    ok: true,
    message: res.data.emailSent ? "Setup link sent." : "Couldn't email it — set RESEND_API_KEY to send links.",
  };
}

export type StudentFormState = { ok: true; message?: string } | { error: string } | null;
export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const ctx = await requireAuth();
  const parsed = createStudentSchema.safeParse({
    admissionNo: formData.get("admissionNo"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    otherNames: formData.get("otherNames"),
    gender: formData.get("gender"),
    dateOfBirth: formData.get("dateOfBirth"),
    classId: formData.get("classId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const res = await studentsService.create(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath("/students");
  return { ok: true };
}

export async function updateStudent(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const ctx = await requireAuth();
  const parsed = updateStudentSchema.safeParse({
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    otherNames: formData.get("otherNames"),
    gender: formData.get("gender"),
    dateOfBirth: formData.get("dateOfBirth"),
    classId: formData.get("classId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const res = await studentsService.update(ctx, parsed.data);
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath(`/students/${parsed.data.id}`);
  return { ok: true };
}

export async function createStudentLogin(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const ctx = await requireAuth();
  const id = String(formData.get("id"));
  const res = await studentsService.createLogin(ctx, { id, email: formData.get("email") as string });
  if (!res.ok) return { error: friendlyMessage(res.error) };
  revalidatePath(`/students/${id}`);
  return {
    ok: true,
    message: res.data.emailSent
      ? "Login created — a password-setup email has been sent."
      : "Login created. Set RESEND_API_KEY to email a setup link automatically.",
  };
}

export async function uploadStudentPhoto(formData: FormData): Promise<UploadResult> {
  const ctx = await requireAuth();
  if (!ctx.schoolId || !can(ctx, "academics.manage")) return { ok: false, error: "You don't have permission to do that." };
  const id = String(formData.get("id"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image." };
  const up = await uploadImage(ctx.schoolId, `student-${id}`, file);
  if (!up.ok || !up.url) return { ok: false, error: up.error ?? "Upload failed." };
  const res = await studentsService.setPhotoUrl(ctx, id, up.url);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  revalidatePath(`/students/${id}`);
  return { ok: true, url: up.url };
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await studentsService.remove(ctx, String(formData.get("id")));
  revalidatePath("/students");
}
