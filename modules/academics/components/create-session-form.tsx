"use client";

import { useActionState, useEffect, useRef } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { createSession, type AcademicsFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSessionForm() {
  const [state, action, pending] = useActionState<AcademicsFormState, FormData>(createSession, null);
  useActionToast(state, "Session created");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="grow space-y-1.5">
        <Label htmlFor="session-name">Session name</Label>
        <Input id="session-name" name="name" placeholder="2025/2026" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="session-start">Starts</Label>
        <Input id="session-start" name="startsOn" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="session-end">Ends</Label>
        <Input id="session-end" name="endsOn" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add session"}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <p className="w-full text-xs text-muted-foreground">
        Each session is created with First, Second &amp; Third terms.
      </p>
    </form>
  );
}
