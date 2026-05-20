"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Check } from "lucide-react";
import { computeClass } from "../actions";
import { Button } from "@/components/ui/button";

export function ComputeButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: true; msg: string } | { error: string } | null>(null);

  function run() {
    setStatus(null);
    startTransition(async () => {
      const res = await computeClass(classId);
      if (res.ok) {
        setStatus({ ok: true, msg: `Computed ${res.subjects} subject(s) for ${res.students} student(s).` });
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
      {status && "ok" in status ? (
        <span className="flex items-center gap-1.5 text-sm text-brand-600">
          <Check className="size-4" /> {status.msg}
        </span>
      ) : null}
      {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
    </div>
  );
}
