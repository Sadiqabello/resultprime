"use client";

import { useActionState, useEffect, useRef } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { createClass, type AcademicsFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const LEVELS = [
  { value: "primary", label: "Primary" },
  { value: "junior_secondary", label: "Junior Secondary" },
  { value: "senior_secondary", label: "Senior Secondary" },
];

export function CreateClassForm() {
  const [state, action, pending] = useActionState<AcademicsFormState, FormData>(createClass, null);
  useActionToast(state, "Class created");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="class-name">Class name</Label>
        <Input id="class-name" name="name" placeholder="JSS 1" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="class-level">Level</Label>
        <select id="class-level" name="level" className={SELECT_CLASS} defaultValue="junior_secondary">
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="class-arm">Arm</Label>
        <Input id="class-arm" name="arm" placeholder="A" className="sm:w-20" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="class-order">Order</Label>
        <Input id="class-order" name="gradeOrder" type="number" min={0} defaultValue={0} className="sm:w-20" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add class"}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-5">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
