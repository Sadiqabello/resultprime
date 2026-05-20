"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSchool, type PlatformFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSchoolForm() {
  const [state, action, pending] = useActionState<PlatformFormState, FormData>(createSchool, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sc-name">School name</Label>
          <Input id="sc-name" name="name" placeholder="Greenfield Academy" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-admin">
            Admin name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id="sc-admin" name="adminName" placeholder="Ada Obi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-email">
            Admin email <span className="text-muted-foreground">(invite)</span>
          </Label>
          <Input id="sc-email" name="adminEmail" type="email" placeholder="admin@school.com" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create school"}
        </Button>
        {state && "error" in state ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-brand-600">{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
