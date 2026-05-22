import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack client (§2.3). API calls (initialize/verify) need PAYSTACK_SECRET_KEY
 * and are gated on it; webhook signature verification is local crypto and always
 * works once the key is set. Webhooks are HMAC-SHA512 of the raw body with the
 * secret key, in the `x-paystack-signature` header.
 *
 * Env: PAYSTACK_SECRET_KEY (sk_test_… / sk_live_…)
 */
const API = "https://api.paystack.co";
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

export const paystackConfigured = () => secret().length > 0;

export interface InitializeArgs {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}
export interface InitializeResult {
  ok: boolean;
  authorizationUrl?: string;
  reference?: string;
  error?: string;
}

export async function initializeTransaction(args: InitializeArgs): Promise<InitializeResult> {
  if (!paystackConfigured()) return { ok: false, error: "Payments are not configured (PAYSTACK_SECRET_KEY)." };
  try {
    const res = await fetch(`${API}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: args.email,
        amount: args.amountKobo,
        reference: args.reference,
        callback_url: args.callbackUrl,
        metadata: args.metadata,
      }),
    });
    const json = (await res.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!res.ok || !json.status) return { ok: false, error: json.message ?? `Paystack ${res.status}` };
    return { ok: true, authorizationUrl: json.data?.authorization_url, reference: json.data?.reference };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface VerifyResult {
  ok: boolean;
  status?: string; // "success" | ...
  amountKobo?: number;
  metadata?: Record<string, unknown>;
  customerCode?: string;
  error?: string;
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  if (!paystackConfigured()) return { ok: false, error: "Payments are not configured." };
  try {
    const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret()}` },
    });
    const json = (await res.json()) as {
      status?: boolean;
      data?: { status?: string; amount?: number; metadata?: Record<string, unknown>; customer?: { customer_code?: string } };
    };
    if (!res.ok || !json.status || !json.data) return { ok: false, error: `Paystack ${res.status}` };
    return {
      ok: true,
      status: json.data.status,
      amountKobo: json.data.amount,
      metadata: json.data.metadata,
      customerCode: json.data.customer?.customer_code,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Verify a webhook's `x-paystack-signature` (HMAC-SHA512 of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !paystackConfigured()) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
