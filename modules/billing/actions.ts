"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { billingService } from "./service";

/**
 * Start checkout for a plan. On success we redirect to Paystack's hosted page;
 * on failure we bounce back to /subscription with a message (form-action style,
 * no client state needed).
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const plan = String(formData.get("plan") ?? "");
  const res = await billingService.startCheckout(ctx, plan);
  if (!res.ok) {
    redirect(`/subscription?error=${encodeURIComponent(friendlyMessage(res.error))}`);
  }
  redirect(res.data.authorizationUrl);
}
