"use client";

import { useActionState, useEffect, useRef } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { createSubject, type AcademicsFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CreateSubjectForm() {
  const [state, action, pending] = useActionState<AcademicsFormState, FormData>(createSubject, null);
  useActionToast(state, "Subject added");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="subject-name">Subject name</Label>
        <Input id="subject-name" name="name" placeholder="Mathematics" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject-code">Code</Label>
        <Input id="subject-code" name="code" placeholder="MTH" className="sm:w-28" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject-category">Category</Label>
        <select id="subject-category" name="category" className={SELECT_CLASS} defaultValue="core">
          <option value="core">Core</option>
          <option value="elective">Elective</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add subject"}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-4">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
