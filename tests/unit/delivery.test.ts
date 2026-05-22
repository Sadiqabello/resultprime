import { describe, it, expect } from "vitest";
import {
  getEmailTransport,
  getWhatsAppTransport,
  renderNotification,
  renderAccountInvite,
} from "@/lib/delivery";

describe("delivery transports", () => {
  it("falls back to the log transport when no provider keys are set", async () => {
    // (no RESEND_API_KEY / TWILIO_* in the test env)
    const email = getEmailTransport();
    const wa = getWhatsAppTransport();
    expect(email.name).toBe("log");
    expect(wa.name).toBe("log");
    const r = await email.send({ to: "a@b.com", subject: "Hi", text: "body" });
    expect(r.ok).toBe(true);
    expect(r.id).toBeTruthy();
  });

  it("renders a results_published notification for email + whatsapp", () => {
    const r = renderNotification("results_published", { className: "JSS1 A", termName: "First" }, "https://app.test");
    expect(r.subject).toContain("JSS1 A");
    expect(r.subject).toContain("First");
    expect(r.text).toContain("https://app.test/portal");
    expect(r.html).toContain("<a");
  });

  it("renders an account-setup invite with the school name and link", () => {
    const setupUrl = "https://app.test/auth/confirm?token_hash=abc&type=recovery&next=%2Fupdate-password";
    const r = renderAccountInvite({ schoolName: "Bright Future Academy", roleLabel: "parent", setupUrl });
    expect(r.subject).toContain("Bright Future Academy");
    expect(r.subject).toContain("parent");
    expect(r.text).toContain(setupUrl);
    expect(r.html).toContain(`href="${setupUrl}"`);
  });
});
