import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/paystack";

// verifyWebhookSignature reads the secret at call time, so setting it here works.
beforeAll(() => { process.env.PAYSTACK_SECRET_KEY = "sk_test_unit_secret"; });

describe("paystack webhook signature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { amount: 5000000 } });
  const sign = (s: string) => createHmac("sha512", s).update(body).digest("hex");

  it("accepts a correctly-signed payload", () => {
    expect(verifyWebhookSignature(body, sign("sk_test_unit_secret"))).toBe(true);
  });
  it("rejects a wrong signature", () => {
    expect(verifyWebhookSignature(body, sign("wrong-secret"))).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });
  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });
  it("rejects when a tampered body no longer matches the signature", () => {
    const sig = sign("sk_test_unit_secret");
    expect(verifyWebhookSignature(body + "x", sig)).toBe(false);
  });
});
