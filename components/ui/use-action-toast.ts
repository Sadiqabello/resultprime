"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Fires a toast whenever a `useActionState` result changes. Works with this
 * app's standard action-state shapes:
 *   { ok: true; message?: string }  → success toast (message or `successMessage`)
 *   { error: string }               → error toast
 *   null                            → nothing (initial / pending)
 *
 * Keep inline field errors where they are; this is for action-level outcomes.
 */
type ActionState = { ok: true; message?: string } | { error: string } | null | undefined;

export function useActionToast(state: ActionState, successMessage = "Saved") {
  useEffect(() => {
    if (!state) return;
    if ("ok" in state) {
      toast.success(state.message ?? successMessage);
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, successMessage]);
}
