"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudent, type StudentFormState } from "../actions";
import type { ClassOption } from "../service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function AddStudentForm({ classes }: { classes: ClassOption[] }) {
  const [state, action, pending] = useActionState<StudentFormState, FormData>(createStudent, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="st-last">Last name</Label>
          <Input id="st-last" name="lastName" placeholder="Okafor" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-first">First name</Label>
          <Input id="st-first" name="firstName" placeholder="Adaeze" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-other">Other names</Label>
          <Input id="st-other" name="otherNames" placeholder="(optional)" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-adm">Admission no.</Label>
          <Input id="st-adm" name="admissionNo" placeholder="0421" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-class">Class</Label>
          <select id="st-class" name="classId" className={SELECT} required defaultValue="">
            <option value="" disabled>
              Select class…
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-gender">Gender</Label>
          <select id="st-gender" name="gender" className={SELECT} defaultValue="">
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-dob">Date of birth</Label>
          <Input id="st-dob" name="dateOfBirth" type="date" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add student"}
        </Button>
        {state && "error" in state ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-brand-600">Student enrolled in the current term.</p>
        ) : null}
      </div>
    </form>
  );
}
