import { NextResponse, type NextRequest } from "next/server";

/**
 * Payment provider webhook (Paystack/Flutterwave/Stripe — Phase 6). ALWAYS
 * verify the signature against the raw body before trusting the event. Webhooks
 * are public endpoints; signature verification is the only thing that
 * authenticates them.
 */
export async function POST(request: NextRequest) {
  const _rawBody = await request.text();
  // TODO: verify provider signature header against _rawBody, then handle event
  // (subscription activated / payment succeeded / failed) and update billing.
  return NextResponse.json({ received: true });
}
