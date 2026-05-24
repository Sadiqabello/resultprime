import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { billingService } from "@/modules/billing/service";
import { logger } from "@/lib/logger";

/**
 * Paystack webhook (§2.3). Public endpoint — the HMAC-SHA512 signature over the
 * RAW body is the ONLY thing that authenticates it, so verify before trusting.
 * On a verified event we update the school's subscription (service-role).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  try {
    const result = await billingService.handleWebhookEvent(event);
    // Answer non-2xx on a genuine processing failure so Paystack retries the
    // delivery. A duplicate (already-applied) event returns ok:true — no retry.
    if (!result.ok) {
      logger.error("billing.webhook_unprocessed", { event: event.event, handled: result.handled });
      return new NextResponse("Processing error", { status: 500 });
    }
    return NextResponse.json({ received: true, ...result });
  } catch (e) {
    logger.error("billing.webhook_failed", { event: event.event, error: (e as Error).message });
    return new NextResponse("Processing error", { status: 500 }); // let Paystack retry
  }
}
