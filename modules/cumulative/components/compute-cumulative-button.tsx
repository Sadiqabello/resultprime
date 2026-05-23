"use client";

import { useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { computeCumulative } from "../actions";
import { Button } from "@/components/ui/button";

export function ComputeCumulativeButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: true; message: string } | { error: string } | null>(null);
  useActionToast(status, "Cumulative results computed");

  function run() {
    setStatus(null);
    start(async () => {
      const res = await computeCumulative(classId);
      if (res.ok) {
        setStatus({ ok: true, message: `Combined ${res.terms} term(s) for ${res.students} student(s).` });
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
        {pending ? "Computing…" : "Compute annual results"}
      </Button>
      {status && "error" in status ? <span className="text-sm text-destructive">{status.error}</span> : null}
    </div>
  );
}
