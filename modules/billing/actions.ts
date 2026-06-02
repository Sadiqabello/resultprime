"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth/service";
import { friendlyMessage } from "@/lib/errors";
import { isBillingPeriod } from "@/config/plans";
import { billingService } from "./service";

/**
 * Start checkout for `quantity` student slots over a `period` (term | session).
 * On success we redirect to Paystack's hosted page; on failure we bounce back to
 * /subscription with a message (form-action style, no client state needed).
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const periodRaw = String(formData.get("period") ?? "");
  const period = isBillingPeriod(periodRaw) ? periodRaw : "session";
  const quantity = Math.trunc(Number(formData.get("quantity")));
  const res = await billingService.startCheckout(ctx, { period, quantity });
  if (!res.ok) {
    redirect(`/subscription?error=${encodeURIComponent(friendlyMessage(res.error))}`);
  }
  redirect(res.data.authorizationUrl);
}
