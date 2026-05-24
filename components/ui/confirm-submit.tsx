"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/**
 * Accessible "are you sure?" gate for a destructive server action.
 *
 * Renders a trigger (styled by `triggerClassName`) that opens a modal
 * confirmation. Only on confirm is the server `action` invoked — with `fields`
 * packed into FormData — so a stray click can never delete a record. The dialog
 * shows a pending state, closes itself when the action resolves, traps Escape,
 * locks body scroll, and focuses the (non-destructive) Cancel button first.
 *
 * The `action` is a server action passed down from a Server Component page.
 */
export function ConfirmSubmit({
  action,
  fields = {},
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  successMessage = "Done",
  triggerClassName,
  triggerAriaLabel,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  successMessage?: string;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, pending]);

  function onConfirm() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(successMessage);
        setOpen(false);
      } catch (e) {
        // Surface the action's message when it survived (dev / known errors);
        // Next redacts server-action error messages in production, so fall back.
        const msg = e instanceof Error && e.message ? e.message : "";
        toast.error(msg && !msg.includes("digest") ? msg : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={triggerAriaLabel}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-[1px]"
            aria-hidden
            onClick={() => (pending ? null : setOpen(false))}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
              {title}
            </h2>
            <div id={descId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className={cn(buttonVariants({ variant: destructive ? "destructive" : "default", size: "sm" }))}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
