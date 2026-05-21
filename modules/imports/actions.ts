"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { importsService, type ScoreImportPreview, type ScoreImportResult } from "./service";
import { importContextSchema } from "./schema";

export type PreviewResult =
  | { ok: true; preview: ScoreImportPreview }
  | { ok: false; error: string };
export type CommitResult =
  | { ok: true; result: ScoreImportResult }
  | { ok: false; error: string };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — a class roster is a few KB; this is generous.
const ALLOWED_EXT = /\.(xlsx|xls|csv)$/i;

/** Pull and validate the (file, classSubjectId) pair from a server-action FormData. */
function readUpload(formData: FormData): { classSubjectId: string; file: File } | { error: string } {
  const parsed = importContextSchema.safeParse({ classSubjectId: formData.get("classSubjectId") });
  if (!parsed.success) return { error: "Missing class-subject." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a spreadsheet to upload." };
  if (!ALLOWED_EXT.test(file.name)) return { error: "Upload an Excel file (.xlsx) or .csv." };
  if (file.size > MAX_BYTES) return { error: "That file is too large (max 5 MB)." };

  return { classSubjectId: parsed.data.classSubjectId, file };
}

/** Parse + validate an uploaded sheet and return the diff preview. No write. */
export async function previewScoreImport(formData: FormData): Promise<PreviewResult> {
  const ctx = await requireAuth();
  const upload = readUpload(formData);
  if ("error" in upload) return { ok: false, error: upload.error };

  const buffer = await upload.file.arrayBuffer();
  const res = await importsService.preview(ctx, upload.classSubjectId, buffer);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };
  return { ok: true, preview: res.data };
}

/** Re-validate and commit the previewed import in one bulk upsert. */
export async function commitScoreImport(formData: FormData): Promise<CommitResult> {
  const ctx = await requireAuth();
  const upload = readUpload(formData);
  if ("error" in upload) return { ok: false, error: upload.error };

  const buffer = await upload.file.arrayBuffer();
  const res = await importsService.commit(ctx, upload.classSubjectId, buffer, upload.file.name);
  if (!res.ok) return { ok: false, error: friendlyMessage(res.error) };

  revalidatePath(`/scores/${upload.classSubjectId}`);
  revalidatePath(`/imports/${upload.classSubjectId}`);
  return { ok: true, result: res.data };
}
