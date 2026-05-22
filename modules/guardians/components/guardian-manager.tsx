"use client";

import { useActionState } from "react";
import { Check, UserPlus } from "lucide-react";
import { addGuardian, type GuardianFormState } from "../actions";
import type { GuardianView } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GuardianManager({
  studentId,
  guardians,
  canManage,
}: {
  studentId: string;
  guardians: GuardianView[];
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<GuardianFormState, FormData>(addGuardian, null);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Parents / guardians</p>

      {guardians.length === 0 ? (
        <p className="text-sm text-muted-foreground">No guardians linked yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {guardians.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span>
                <span className="font-medium">{g.fullName}</span>
                {g.relationship ? <span className="ml-2 text-xs text-muted-foreground">{g.relationship}</span> : null}
                {g.isPrimary ? <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">primary</span> : null}
                {g.email ? <span className="block text-xs text-muted-foreground">{g.email}</span> : null}
              </span>
              {g.hasLogin ? (
                <span className="flex items-center gap-1 text-xs text-brand-700"><Check className="size-3.5" /> has login</span>
              ) : (
                <span className="text-xs text-muted-foreground">no login</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form action={action} className="space-y-3 rounded-lg border p-4">
          <input type="hidden" name="studentId" value={studentId} />
          <p className="text-xs font-medium text-muted-foreground">Add a guardian</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="g-name">Full name</Label>
              <Input id="g-name" name="fullName" placeholder="Mr Adewale Obi" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-rel">Relationship</Label>
              <Input id="g-rel" name="relationship" placeholder="Father" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-email">Email</Label>
              <Input id="g-email" name="email" type="email" placeholder="parent@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-phone">Phone</Label>
              <Input id="g-phone" name="phone" placeholder="080…" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="isPrimary" className="size-4 rounded border-input" /> Primary contact</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="createLogin" className="size-4 rounded border-input" /> Create parent login (needs email)</label>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}><UserPlus className="size-4" /> {pending ? "Adding…" : "Add guardian"}</Button>
            {state && "ok" in state ? (
              <span className="flex items-center gap-1 text-sm text-brand-600">
                <Check className="size-4" /> Added
                {state.loginCreated ? (state.emailSent ? " — setup email sent" : " with login") : ""}.
              </span>
            ) : null}
            {state && "error" in state ? <span className="text-sm text-destructive">{state.error}</span> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
