import "server-only";
import { ok, err, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { AuthContext } from "@/lib/authz";
import { notificationsRepository } from "./repository";

/**
 * Notifications (§2.2, §13). MVP delivers the `in_app` channel (rows the user
 * sees in their inbox); email / SMS / WhatsApp are a later delivery worker that
 * reads the same rows. Insert failures must never break the triggering action,
 * so callers treat this as best-effort.
 */
export type Channel = "in_app" | "email" | "sms" | "whatsapp";

export interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Render a stored notification into display text. */
function present(type: string, payload: Record<string, unknown>): { title: string; body: string; href: string | null } {
  switch (type) {
    case "results_published":
      return {
        title: "Results published",
        body: `${payload.className ?? "A class"}'s ${payload.termName ?? ""} term results are now available.`,
        href: payload.enrollmentId ? `/print/report/${payload.enrollmentId}` : null,
      };
    default:
      return { title: type, body: "", href: null };
  }
}

export const notificationsService = {
  async enqueue(args: {
    schoolId: string;
    recipientUserId: string;
    channel?: Channel;
    type: string;
    payload?: Record<string, unknown>;
  }): Promise<Result<null>> {
    const { error } = await notificationsRepository.insertMany([
      {
        school_id: args.schoolId,
        recipient_user_id: args.recipientUserId,
        channel: args.channel ?? "in_app",
        type: args.type,
        payload: args.payload ?? {},
      },
    ]);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  /**
   * Fan-out when a class's results are published: notify each student/guardian
   * with an account, plus the class's form teacher. Best-effort (never throws).
   */
  async notifyResultsPublished(args: { schoolId: string; classId: string; termId: string; termName: string }) {
    try {
      const { schoolId, classId, termId, termName } = args;
      const { data: klass } = await notificationsRepository.getClassMeta(schoolId, classId);
      const className = klass ? (klass.arm ? `${klass.name} ${klass.arm}` : (klass.name as string)) : "A class";

      const { studentUserIds, studentIds } = await notificationsRepository.studentUserIdsForClass(schoolId, classId, termId);
      const guardianUserIds = await notificationsRepository.guardianUserIdsForStudents(schoolId, studentIds);
      const recipients = [...new Set([...studentUserIds, ...guardianUserIds, klass?.form_teacher_id].filter((x): x is string => Boolean(x)))];

      if (recipients.length === 0) {
        logger.info("notifications.publish_no_recipients", { schoolId, classId });
        return;
      }
      const payload = { classId, className, termId, termName };

      // in-app for everyone; email/WhatsApp additionally where we have contact.
      const { data: contacts } = await notificationsRepository.loadUserContacts(recipients);
      const contact = new Map((contacts ?? []).map((c) => [c.id, c]));

      const rows: Record<string, unknown>[] = [];
      for (const uid of recipients) {
        rows.push({ school_id: schoolId, recipient_user_id: uid, channel: "in_app", type: "results_published", payload });
        const c = contact.get(uid);
        if (c?.email) rows.push({ school_id: schoolId, recipient_user_id: uid, channel: "email", type: "results_published", payload });
        if (c?.phone) rows.push({ school_id: schoolId, recipient_user_id: uid, channel: "whatsapp", type: "results_published", payload });
      }

      const { error } = await notificationsRepository.insertMany(rows);
      if (error) logger.error("notifications.publish_insert_failed", { schoolId, classId, error: error.message });
      else logger.info("notifications.published", { schoolId, classId, recipients: recipients.length, rows: rows.length });
    } catch (e) {
      logger.error("notifications.publish_failed", { error: (e as Error).message });
    }
  },

  async inbox(ctx: AuthContext): Promise<Result<InboxItem[]>> {
    const { data, error } = await notificationsRepository.listForUser(ctx.userId);
    if (error) return err("INTERNAL", error.message);
    const items: InboxItem[] = (data ?? []).map((n) => {
      const p = (n.payload as Record<string, unknown>) ?? {};
      const { title, body, href } = present(n.type as string, p);
      return { id: n.id as string, type: n.type as string, title, body, href, readAt: (n.read_at as string | null) ?? null, createdAt: n.created_at as string };
    });
    return ok(items);
  },

  async unreadCount(ctx: AuthContext): Promise<number> {
    const { count, error } = await notificationsRepository.unreadCount(ctx.userId);
    if (error) return 0;
    return count ?? 0;
  },

  async markRead(ctx: AuthContext, id: string): Promise<Result<null>> {
    const { error } = await notificationsRepository.markRead(ctx.userId, id);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },

  async markAllRead(ctx: AuthContext): Promise<Result<null>> {
    const { error } = await notificationsRepository.markAllRead(ctx.userId);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },
};
