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

/* ───────────────────────────────────────────────────────────────────────────
   Branded email templates. Email clients are unforgiving, so these use a
   table-based, fully inline-styled layout with a hosted PNG logo (SVG isn't
   supported in most clients), web-safe fonts (Georgia for headings to echo the
   brand serif, Helvetica/Arial for body), and a bulletproof CTA. Every email
   shares emailLayout() so the header, footer and branding stay consistent.
   ─────────────────────────────────────────────────────────────────────────── */
const BRAND = {
  navy: "#03045E",
  crimson: "#D62F3A",
  body: "#3F4458",
  muted: "#9AA0AD",
  canvas: "#EEF0F4",
  border: "#E6E8EE",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/** Bulletproof-ish CTA: inline-block anchor inside a table cell (URL kept raw). */
function ctaButton(label: string, url: string, color: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px;"><tr>` +
    `<td style="border-radius:8px;background:${color};">` +
    `<a href="${url}" style="display:inline-block;padding:13px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)} &rarr;</a>` +
    `</td></tr></table>`
  );
}

/** The shared branded shell. `lede`/`note` are plain text (escaped); `bodyHtml` is trusted markup. */
function emailLayout(o: {
  appUrl: string;
  preheader: string;
  heading: string;
  lede: string;
  bodyHtml?: string;
  cta?: { label: string; url: string; color?: string };
  note?: string;
}): string {
  const year = new Date().getFullYear();
  const cta = o.cta ? ctaButton(o.cta.label, o.cta.url, o.cta.color ?? BRAND.navy) : "";
  const link = o.cta
    ? `<p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">If the button doesn&rsquo;t work, paste this link into your browser:<br><a href="${o.cta.url}" style="color:#0077B6;word-break:break-all;">${o.cta.url}</a></p>`
    : "";
  const note = o.note
    ? `<p style="margin:20px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:#6B7280;">${esc(o.note)}</p>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="x-apple-disable-message-reformatting"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.canvas};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(o.preheader)}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvas};"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
    <tr><td style="background:${BRAND.navy};padding:22px 32px;">
      <img src="${o.appUrl}/brand/email-logo.png" alt="Result Prime" width="170" height="38" style="display:block;border:0;outline:none;height:38px;width:170px;">
    </td></tr>
    <tr><td style="padding:38px 32px 6px;">
      <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:25px;line-height:1.25;color:${BRAND.navy};">${esc(o.heading)}</h1>
      <p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.body};">${esc(o.lede)}</p>
      ${o.bodyHtml ?? ""}
      ${cta}
      ${link}
      ${note}
    </td></tr>
    <tr><td style="padding:26px 32px 30px;border-top:1px solid ${BRAND.canvas};">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
        <strong style="color:${BRAND.navy};">Result Prime</strong> &mdash; the official record of every child&rsquo;s term.<br>
        You&rsquo;re receiving this from your school&rsquo;s results system.
      </p>
    </td></tr>
  </table>
  <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#AAB0BD;">&copy; ${year} Result Prime &middot; Results, at their prime.</p>
</td></tr></table>
</body></html>`;
}

/** A small crimson "verified" pill for results emails. */
function verifiedPill(): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;"><tr>` +
    `<td style="background:#FCE9EA;border-radius:999px;padding:7px 14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;color:${BRAND.crimson};">&#10003;&nbsp; Every report card is QR-verified</td>` +
    `</tr></table>`
  );
}

/**
 * Password-setup invite for a freshly provisioned student/parent/staff login.
 * The link hits /auth/confirm (verifies the token), then /update-password.
 * `appUrl` is derived from the setup link when not passed.
 */
export function renderAccountInvite(opts: {
  schoolName: string;
  roleLabel: string;
  setupUrl: string;
  appUrl?: string;
}): { subject: string; text: string; html: string } {
  const { schoolName, roleLabel, setupUrl } = opts;
  const appUrl = opts.appUrl ?? safeOrigin(setupUrl);
  const subject = `Set up your ${schoolName} ${roleLabel} account`;
  const text =
    `Welcome to ${schoolName} on Result Prime.\n\n` +
    `An account has been created for you. Set a password to sign in and view results:\n${setupUrl}\n\n` +
    `This link is single-use, so please set your password soon. If you didn't expect this, you can safely ignore this email.\n\n— Result Prime`;
  const html = emailLayout({
    appUrl,
    preheader: `Set your password to access ${schoolName} on Result Prime.`,
    heading: "Set your password",
    lede: `An account has been created for you at ${schoolName}. Set a password to sign in and view your results securely.`,
    cta: { label: "Set your password", url: setupUrl },
    note: "This link is single-use, so please set your password soon. If you didn't expect this, you can safely ignore this email.",
  });
  return { subject, text, html };
}

/** Billing reminder (trial ending / read-only grace) — links to the renew page. */
export function renderBillingReminder(opts: {
  schoolName: string;
  appUrl: string;
  heading: string;
  lede: string;
  note?: string;
}): { subject: string; text: string; html: string } {
  const url = `${opts.appUrl}/subscription`;
  const subject = `${opts.heading} — ${opts.schoolName}`;
  const text = `${opts.lede}\n\nRenew or manage your subscription:\n${url}\n\n— Result Prime`;
  const html = emailLayout({
    appUrl: opts.appUrl,
    preheader: opts.lede,
    heading: opts.heading,
    lede: opts.lede,
    cta: { label: "Manage subscription", url, color: BRAND.crimson },
    note: opts.note,
  });
  return { subject, text, html };
}

/** Render a stored notification into branded, channel-ready content. */
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
    const text =
      `Good news — ${cls}'s ${term} term results have been published on Result Prime.\n\n` +
      `View and download the report card here:\n${link}\n\nEvery report card is QR-verified.\n\n— Result Prime`;
    const html = emailLayout({
      appUrl,
      preheader: `${cls}'s ${term} term results are now available to view and download.`,
      heading: "Results are ready",
      lede: `${cls}'s ${term} term results have been published. You can now view and download the report card.`,
      bodyHtml: verifiedPill(),
      cta: { label: "View results", url: link },
      note: "Sign in with your Result Prime account to see the full report card.",
    });
    return { subject, text, html };
  }

  // Generic, still-branded fallback for any other notification type.
  const link = `${appUrl}/portal`;
  const subject = "You have a new update from Result Prime";
  const text = `You have a new update on Result Prime.\n\nOpen your portal: ${link}\n\n— Result Prime`;
  const html = emailLayout({
    appUrl,
    preheader: "You have a new update on Result Prime.",
    heading: "A new update",
    lede: "There's a new update waiting for you on Result Prime.",
    cta: { label: "Open Result Prime", url: link },
  });
  return { subject, text, html };
}
