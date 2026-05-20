import "server-only";
import { ok, type Result } from "@/lib/errors";

/**
 * Notifications (§2.2). Channels: in_app (MVP), then email / SMS / WhatsApp.
 * Bulk sends (e.g. "results published") run as background jobs (§14.6), not in
 * a request. Persist every notification for an in-app inbox + delivery audit.
 */
export type Channel = "in_app" | "email" | "sms" | "whatsapp";

export const notificationsService = {
  async enqueue(_args: {
    schoolId: string;
    recipientUserId: string;
    channel: Channel;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<Result<null>> {
    // TODO: insert into `notifications`; a worker delivers via the channel.
    return ok(null);
  },
};
