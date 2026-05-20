"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { studentsService } from "./service";
import { createStudentSchema } from "./schema";

export type StudentFormState = { ok: true } | { error: string } | null;

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

export async function deleteStudent(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  await studentsService.remove(ctx, String(formData.get("id")));
  revalidatePath("/students");
}
