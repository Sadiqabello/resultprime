"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Check, Upload, UserPlus } from "lucide-react";
import { updateStudent, createStudentLogin, uploadStudentPhoto, type StudentFormState } from "../actions";
import type { StudentDetail } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  detail: StudentDetail;
  classes: { id: string; label: string }[];
  canManage: boolean;
}

export function StudentManager({ detail, classes, canManage }: Props) {
  const [editState, editAction, editing] = useActionState<StudentFormState, FormData>(updateStudent, null);
  const [loginState, loginAction, loggingIn] = useActionState<StudentFormState, FormData>(createStudentLogin, null);
  const [photo, setPhoto] = useState<string | null>(detail.photoUrl);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(file: File | null) {
    if (!file) return;
    setPhotoErr(null);
    const fd = new FormData();
    fd.set("id", detail.id);
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadStudentPhoto(fd);
      if (res.ok) setPhoto(res.url);
      else setPhotoErr(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Photo + identity */}
      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-muted-foreground">
            {detail.firstName[0]}{detail.lastName[0]}
          </span>
        )}
        <div>
          <p className="text-lg font-semibold">{detail.lastName} {detail.firstName} {detail.otherNames}</p>
          <p className="font-mono text-sm text-muted-foreground">{detail.admissionNo}</p>
          {canManage ? (
            <div className="mt-1">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Upload className="size-3.5" /> {uploading ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
              </button>
              {photoErr ? <span className="ml-2 text-xs text-destructive">{photoErr}</span> : null}
            </div>
          ) : null}
        </div>
      </div>

      {canManage ? (
        <>
          {/* Edit details */}
          <form action={editAction} className="space-y-4 rounded-lg border p-4">
            <input type="hidden" name="id" value={detail.id} />
            <p className="text-sm font-medium">Edit details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="lastName" label="Surname" defaultValue={detail.lastName} required />
              <Field name="firstName" label="First name" defaultValue={detail.firstName} required />
              <Field name="otherNames" label="Other names" defaultValue={detail.otherNames ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" name="gender" defaultValue={detail.gender ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <Field name="dateOfBirth" label="Date of birth" type="date" defaultValue={detail.dateOfBirth ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="classId">Class</Label>
                <select id="classId" name="classId" defaultValue={detail.classId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                  <option value="">—</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={editing}>{editing ? "Saving…" : "Save changes"}</Button>
              {editState && "ok" in editState ? <span className="flex items-center gap-1 text-sm text-brand-600"><Check className="size-4" /> Saved</span> : null}
              {editState && "error" in editState ? <span className="text-sm text-destructive">{editState.error}</span> : null}
            </div>
          </form>

          {/* Student login */}
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Student login</p>
            {detail.hasLogin ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-700"><Check className="size-4" /> This student has a portal login.</p>
            ) : (
              <form action={loginAction} className="mt-2 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={detail.id} />
                <div className="space-y-1.5">
                  <Label htmlFor="student-email">Email</Label>
                  <Input id="student-email" name="email" type="email" placeholder="student@example.com" className="w-64" required />
                </div>
                <Button type="submit" variant="outline" disabled={loggingIn}>
                  <UserPlus className="size-4" /> {loggingIn ? "Creating…" : "Create login"}
                </Button>
                {loginState && "ok" in loginState ? <span className="text-sm text-brand-600">Login created.</span> : null}
                {loginState && "error" in loginState ? <span className="text-sm text-destructive">{loginState.error}</span> : null}
              </form>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Field({ name, label, defaultValue, type = "text", required }: { name: string; label: string; defaultValue?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
