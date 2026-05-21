"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/service";
import { notificationsService } from "./service";

/** Used directly as a <form action> — must resolve to void. */
export async function markNotificationRead(id: string): Promise<void> {
  const ctx = await requireAuth();
  await notificationsService.markRead(ctx, id);
  revalidatePath("/notifications");
  revalidatePath("/(auth)", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const ctx = await requireAuth();
  await notificationsService.markAllRead(ctx);
  revalidatePath("/notifications");
  revalidatePath("/(auth)", "layout");
}
