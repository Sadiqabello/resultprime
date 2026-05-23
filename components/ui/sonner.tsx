"use client";

import { Toaster as Sonner } from "sonner";

/**
 * App-wide toast surface (mounted once in the root layout). `richColors` gives
 * success / error / warning / info their own semantics; styling is matched to
 * the brand (Hanken body, soft border + shadow). Use via `toast.success(...)`,
 * `toast.error(...)`, `toast.warning(...)`, `toast.info(...)` from "sonner",
 * or the `useActionToast` hook for server-action results.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      gap={10}
      toastOptions={{
        classNames: {
          toast: "font-sans rounded-xl border shadow-lg",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
