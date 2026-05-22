import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Image uploads to Supabase Storage (§9.7). Writes go through the service-role
 * client to a public bucket under a per-tenant path; the SERVICE that calls this
 * must already have authorized the caller for the school. SVG is intentionally
 * disallowed (SVG can carry scripts → stored-XSS when served inline). The bucket
 * is created on first use (idempotent).
 */
const BUCKET = "school-assets";
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

let bucketEnsured = false;
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  if (bucketEnsured) return;
  // createBucket errors if it already exists — ignore that.
  await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES }).catch(() => {});
  bucketEnsured = true;
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image for a school. `kind` becomes part of the object path
 * (e.g. "logo", "signature", "student-<id>"). Returns a public URL.
 */
export async function uploadImage(schoolId: string, kind: string, file: File): Promise<UploadResult> {
  const ext = ALLOWED.get(file.type);
  if (!ext) return { ok: false, error: "Use a PNG, JPG or WEBP image." };
  if (file.size === 0) return { ok: false, error: "The file is empty." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image too large (max 2 MB)." };

  const admin = createAdminClient();
  await ensureBucket(admin);

  const safeKind = kind.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "asset";
  const path = `${schoolId}/${safeKind}-${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
