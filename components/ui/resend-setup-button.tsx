"use client";

import { useActionState } from "react";
import { RotateCw } from "lucide-react";
import { useActionToast } from "./use-action-toast";

/** Shared result shape for "resend setup link" server actions. */
export type ResendState = { ok: true; message: string } | { error: string } | null;

/**
 * Re-sends the password-setup email to an existing login (student / staff /
 * parent) whose link expired or never arrived. The server action looks the
 * email up server-side (scoped to the school) — the id alone is passed.
 */
export function ResendSetupButton({
  action,
  id,
  className,
  label = "Resend setup link",
}: {
  action: (prev: ResendState, formData: FormData) => Promise<ResendState>;
  id: string;
  className?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState<ResendState, FormData>(action, null);
  useActionToast(state, "Setup link sent.");
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={className ?? "inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-60"}
      >
        <RotateCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Sending…" : label}
      </button>
    </form>
  );
}
