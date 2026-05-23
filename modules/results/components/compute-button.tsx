"use client";

import { useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { computeClass } from "../actions";
import { Button } from "@/components/ui/button";

export function ComputeButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: true; message: string } | { error: string } | null>(null);
  useActionToast(status, "Results computed");

  function run() {
    setStatus(null);
    startTransition(async () => {
      const res = await computeClass(classId);
      if (res.ok) {
        setStatus({ ok: true, message: `Computed ${res.subjects} subject(s) for ${res.students} student(s).` });
        router.refresh();
      } else {
        setStatus({ error: res.error });
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={run} disabled={pending}>
        <Calculator className="size-4" />
        {pending ? "Computing…" : "Compute results"}
      </Button>
      {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
    </div>
  );
}
