"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStaff, type StaffFormState } from "../actions";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "../schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function AddStaffForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(addStaff, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Full name</Label>
          <Input id="s-name" name="fullName" placeholder="Ada Obi" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-no">Staff number</Label>
          <Input id="s-no" name="staffNo" placeholder="STF-001" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-role">Role</Label>
          <select id="s-role" name="role" className={SELECT} defaultValue="teacher">
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-email">
            Email <span className="text-muted-foreground">(optional — sends a login invite)</span>
          </Label>
          <Input id="s-email" name="email" type="email" placeholder="teacher@school.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-phone">Phone</Label>
          <Input id="s-phone" name="phone" placeholder="080…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-qual">Qualification</Label>
          <Input id="s-qual" name="qualification" placeholder="B.Sc. Ed." />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isTeaching" defaultChecked className="size-4 accent-brand-600" />
          Teaching staff
        </label>
        <Button type="submit" disabled={pending} className="ml-auto">
          {pending ? "Adding…" : "Add staff"}
        </Button>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state && "ok" in state && state.ok ? (
        <p className="text-sm text-brand-600">Staff added{`. `}If you set an email, an invite is on its way.</p>
      ) : null}
    </form>
  );
}
