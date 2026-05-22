import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getEmailTransport, getWhatsAppTransport, renderNotification } from "@/lib/delivery";

export interface DeliveryRun {
  processed: number;
  sent: number;
  failed: number;
}

/**
 * Deliver pending email/WhatsApp/SMS notifications (§14.6 background worker).
 * A system job: uses the service-role client (no user context, cross-tenant),
 * resolves each recipient's contact, sends via the configured transport, and
 * marks the row sent/failed. Idempotent — only `pending` rows are picked up.
 */
export async function deliverPending(limit = 100): Promise<DeliveryRun> {
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("notifications")
    .select("id, recipient_user_id, channel, type, payload")
    .in("channel", ["email", "whatsapp", "sms"])
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  const rows = pending ?? [];
  if (rows.length === 0) return { processed: 0, sent: 0, failed: 0 };

  const userIds = [...new Set(rows.map((r) => r.recipient_user_id).filter((x): x is string => Boolean(x)))];
  const { data: users } = await admin
    .from("users")
    .select("id, email, phone")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const contact = new Map((users ?? []).map((u) => [u.id, u]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const email = getEmailTransport();
  const whatsapp = getWhatsAppTransport();

  const mark = async (id: string, status: "sent" | "failed") =>
    admin
      .from("notifications")
      .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null })
      .eq("id", id);

  let sent = 0;
  let failed = 0;
  for (const n of rows) {
    const c = contact.get(n.recipient_user_id as string);
    const r = renderNotification(n.type as string, (n.payload as Record<string, unknown>) ?? {}, appUrl);

    let result;
    if (n.channel === "email") {
      if (!c?.email) { await mark(n.id as string, "failed"); failed++; continue; }
      result = await email.send({ to: c.email as string, subject: r.subject, text: r.text, html: r.html });
    } else {
      // whatsapp | sms
      if (!c?.phone) { await mark(n.id as string, "failed"); failed++; continue; }
      result = await whatsapp.send({ to: c.phone as string, body: r.text });
    }

    if (result.ok) { await mark(n.id as string, "sent"); sent++; }
    else { await mark(n.id as string, "failed"); failed++; logger.error("delivery.failed", { id: n.id, channel: n.channel, error: result.error }); }
  }

  logger.info("delivery.run", { processed: rows.length, sent, failed });
  return { processed: rows.length, sent, failed };
}
