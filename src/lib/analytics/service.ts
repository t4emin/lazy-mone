import "server-only";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import type { AnalyticsInput } from "./validation";

export async function saveAnalytics(userId: string, input: AnalyticsInput) {
  const content = await getDb().contentDraft.findFirst({
    where: { id: input.contentId, userId },
    select: { id: true, productId: true },
  });
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  const collectedOn = new Date(`${input.collectedOn}T12:00:00.000Z`);
  const metrics = {
    platform: input.platform,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    clicks: input.clicks,
    orders: input.orders,
    commission: input.commission,
  };
  return getDb().analyticsSnapshot.upsert({
    where: {
      contentId_platform_collectedOn: {
        contentId: content.id,
        platform: input.platform,
        collectedOn,
      },
    },
    update: metrics,
    create: { userId, productId: content.productId, ...input, collectedOn },
  });
}

export function listAnalytics(userId: string) {
  return getDb().analyticsSnapshot.findMany({
    where: { userId },
    include: {
      product: { select: { name: true } },
      content: { select: { hook: true } },
    },
    orderBy: [{ collectedOn: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}
