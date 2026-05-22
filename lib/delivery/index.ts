import "server-only";
import { logger } from "@/lib/logger";

/**
 * Outbound message delivery (§2.2 — email / WhatsApp). Transports are pluggable
 * and chosen from env at runtime: a real provider when its keys are set, else a
 * **log transport** that records the message and reports success (so the rest of
 * the pipeline — enqueue → worker → mark sent — is exercisable without paid keys
 * in dev/CI). Wire real keys to flip to live sending; no code change needed.
 *
 * Env:
 *   RESEND_API_KEY, EMAIL_FROM                          → live email
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM → live WhatsApp
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
export interface WhatsAppMessage {
  to: string; // E.164, e.g. +2348012345678
  body: string;
}
export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}
export interface Transport<M> {
  /** Provider name, surfaced in logs/telemetry. */
  readonly name: string;
  send(message: M): Promise<SendResult>;
}

// ── Email ────────────────────────────────────────────────────────────────────
const resendTransport = (apiKey: string, from: string): Transport<EmailMessage> => ({
  name: "resend",
  async send(msg) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html ?? msg.text, text: msg.text }),
      });
      if (!res.ok) return { ok: false, error: `resend ${res.status}: ${await res.text()}` };
      const data = (await res.json()) as { id?: string };
      return { ok: true, id: data.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
});

const twilioWhatsApp = (sid: string, token: string, from: string): Transport<WhatsAppMessage> => ({
  name: "twilio_whatsapp",
  async send(msg) {
    try {
      const body = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${msg.to}`, Body: msg.body });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) return { ok: false, error: `twilio ${res.status}: ${await res.text()}` };
      const data = (await res.json()) as { sid?: string };
      return { ok: true, id: data.sid };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
});

const logTransport = <M>(channel: string): Transport<M> => ({
  name: "log",
  async send(message) {
    logger.info("delivery.log_transport", { channel, message: message as Record<string, unknown> });
    return { ok: true, id: `log_${Date.now()}` };
  },
});

export function getEmailTransport(): Transport<EmailMessage> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return key && from ? resendTransport(key, from) : logTransport<EmailMessage>("email");
}

export function getWhatsAppTransport(): Transport<WhatsAppMessage> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  return sid && token && from ? twilioWhatsApp(sid, token, from) : logTransport<WhatsAppMessage>("whatsapp");
}

/** Render a stored notification into channel-ready content. */
export function renderNotification(
  type: string,
  payload: Record<string, unknown>,
  appUrl: string,
): { subject: string; text: string; html: string } {
  if (type === "results_published") {
    const cls = String(payload.className ?? "your class");
    const term = String(payload.termName ?? "");
    const link = `${appUrl}/portal`;
    const subject = `${cls} ${term} term results are available`;
    const text = `${cls}'s ${term} term results have been published. View them at ${link}`;
    const html = `<p>${cls}'s <strong>${term} term</strong> results have been published.</p><p><a href="${link}">View results</a></p>`;
    return { subject, text, html };
  }
  return { subject: "Notification", text: type, html: `<p>${type}</p>` };
}
