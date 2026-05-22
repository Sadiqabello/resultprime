"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateStaff, type StaffFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Staff {
  id: string;
  fullName: string;
  staffNo: string;
  phone: string | null;
  qualification: string | null;
  isTeaching: boolean;
}

export function EditStaffForm({ staff }: { staff: Staff }) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(updateStaff, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={staff.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={staff.fullName} required />
        </div>
        <div className="space-y-1.5">
          <Label>Staff no.</Label>
          <Input value={staff.staffNo} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={staff.phone ?? ""} placeholder="080…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" name="qualification" defaultValue={staff.qualification ?? ""} placeholder="B.Sc. Ed." />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isTeaching" defaultChecked={staff.isTeaching} className="size-4 rounded border-input" /> Teaching staff
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {state && "ok" in state ? <span className="flex items-center gap-1 text-sm text-brand-600"><Check className="size-4" /> Saved</span> : null}
        {state && "error" in state ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
