"use client";

import { useState, useTransition } from "react";
import { Check, Upload } from "lucide-react";
import { updateSchoolSettings, uploadBrandingAsset } from "../actions";
import type { BrandingView } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrandingForm({ initial }: { initial: BrandingView }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  const set = <K extends keyof BrandingView>(k: K, val: BrandingView[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setStatus(null);
  };

  function upload(kind: "logo" | "signature", file: File | null) {
    if (!file) return;
    setStatus(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadBrandingAsset(fd);
      if (res.ok) set(kind === "logo" ? "logoUrl" : "principalSignatureUrl", res.url);
      else setStatus({ error: res.error });
    });
  }

  function save() {
    setStatus(null);
    start(async () => {
      const res = await updateSchoolSettings({
        schoolName: v.schoolName,
        logoUrl: v.logoUrl,
        principalSignatureUrl: v.principalSignatureUrl,
        primaryColor: v.primaryColor,
        secondaryColor: v.secondaryColor,
        approvalPolicy: v.approvalPolicy,
        feeGatingEnabled: v.feeGatingEnabled,
        timezone: "Africa/Lagos",
        locale: "en-NG",
      });
      setStatus(res.ok ? { ok: true } : { error: res.error });
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="b-name">School name</Label>
          <Input id="b-name" value={v.schoolName} onChange={(e) => set("schoolName", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {v.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.logoUrl} alt="" className="size-12 rounded border object-contain" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded border text-xs text-muted-foreground">none</span>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent">
              <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload("logo", e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Principal&apos;s signature</Label>
          <div className="flex items-center gap-3">
            {v.principalSignatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.principalSignatureUrl} alt="" className="h-12 w-20 rounded border object-contain" />
            ) : (
              <span className="flex h-12 w-20 items-center justify-center rounded border text-xs text-muted-foreground">none</span>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent">
              <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload("signature", e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="b-primary">Primary colour</Label>
          <div className="flex items-center gap-2">
            <input
              id="b-primary"
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(v.primaryColor) ? v.primaryColor : "#0077b6"}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
            <Input value={v.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="w-32" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="b-secondary">Secondary colour</Label>
          <div className="flex items-center gap-2">
            <input
              id="b-secondary"
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(v.secondaryColor) ? v.secondaryColor : "#023e8a"}
              onChange={(e) => set("secondaryColor", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
            <Input value={v.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="w-32" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="b-approval">Approval policy</Label>
          <select
            id="b-approval"
            value={v.approvalPolicy}
            onChange={(e) => set("approvalPolicy", e.target.value as BrandingView["approvalPolicy"])}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="one_step">One-step (approve = publish authority)</option>
            <option value="two_step">Two-step (VP reviews → Principal approves)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={v.feeGatingEnabled}
            onChange={(e) => set("feeGatingEnabled", e.target.checked)}
            className="size-4 rounded border-input"
          />
          Gate result release on fee clearance
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save branding"}
        </Button>
        {status && "ok" in status ? (
          <span className="flex items-center gap-1.5 text-sm text-brand-600">
            <Check className="size-4" /> Saved
          </span>
        ) : null}
        {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
      </div>
    </div>
  );
}
