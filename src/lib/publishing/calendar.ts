import "server-only";
import { getDb } from "@/lib/db";

export function listScheduledCalendarItems(userId: string) {
  return getDb().publishJob.findMany({
    where: { userId, status: "scheduled", scheduledAt: { not: null } },
    select: {
      id: true,
      contentId: true,
      platform: true,
      scheduledAt: true,
      content: {
        select: {
          hook: true,
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
