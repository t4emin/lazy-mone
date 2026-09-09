import "server-only";
import { getDb } from "@/lib/db";

type Aggregate = {
  id: string;
  name: string;
  contentId?: string;
  views: number;
  clicks: number;
  orders: number;
  commission: number;
  engagement: number;
};

export async function getAffiliateIntelligence(userId: string) {
  const snapshots = await getDb().analyticsSnapshot.findMany({
    where: { userId },
    select: {
      productId: true,
      contentId: true,
      views: true,
      clicks: true,
      orders: true,
      likes: true,
      comments: true,
      shares: true,
      commission: true,
      product: { select: { name: true } },
      content: { select: { hook: true } },
    },
  });
  const products = new Map<string, Aggregate>();
  const contents = new Map<string, Aggregate>();
  for (const snapshot of snapshots) {
    const add = (
      map: Map<string, Aggregate>,
      id: string,
      name: string,
      contentId?: string,
    ) => {
      const row = map.get(id) ?? {
        id,
        name,
        contentId,
        views: 0,
        clicks: 0,
        orders: 0,
        commission: 0,
        engagement: 0,
      };
      row.views += snapshot.views;
      row.clicks += snapshot.clicks;
      row.orders += snapshot.orders;
      row.commission += Number(snapshot.commission.toString());
      row.engagement += snapshot.likes + snapshot.comments + snapshot.shares;
      map.set(id, row);
    };
    add(products, snapshot.productId, snapshot.product.name);
    add(
      contents,
      snapshot.contentId,
      snapshot.content.hook,
      snapshot.contentId,
    );
  }
  const productRank = [...products.values()].sort(
    (a, b) =>
      b.commission - a.commission || b.orders - a.orders || b.clicks - a.clicks,
  );
  const contentRank = [...contents.values()].sort(
    (a, b) => b.engagement - a.engagement || b.clicks - a.clicks,
  );
  const recommendations: string[] = [];
  const bestProduct = productRank[0];
  const bestContent = contentRank[0];
  if (bestProduct)
    recommendations.push(
      `สินค้า “${bestProduct.name}” ทำ commission สูงสุด ${bestProduct.commission.toFixed(2)} THB จาก ${bestProduct.orders} orders — ควรทำคอนเทนต์ต่อยอดหรือ comparison เพิ่ม`,
    );
  if (bestContent)
    recommendations.push(
      `คอนเทนต์ “${bestContent.name.slice(0, 80)}” มี engagement สูงสุด ${bestContent.engagement.toLocaleString()} — ใช้ hook หรือแนวทางเดียวกันกับสินค้าอื่นได้`,
    );
  const highViewLowClick = contentRank.find(
    (item) => item.views >= 100 && item.clicks / item.views < 0.01,
  );
  if (highViewLowClick)
    recommendations.push(
      `คอนเทนต์ “${highViewLowClick.name.slice(0, 80)}” มี ${highViewLowClick.views.toLocaleString()} views แต่ click-through ต่ำ — ลองปรับ CTA และตำแหน่ง affiliate link`,
    );
  const highClickNoOrder = productRank.find(
    (item) => item.clicks >= 10 && item.orders === 0,
  );
  if (highClickNoOrder)
    recommendations.push(
      `สินค้า “${highClickNoOrder.name}” มี ${highClickNoOrder.clicks.toLocaleString()} clicks แต่ยังไม่มี order — ตรวจ landing page, ราคา หรือข้อเสนออีกครั้ง`,
    );
  return {
    snapshotCount: snapshots.length,
    products: productRank.slice(0, 5),
    contents: contentRank.slice(0, 5),
    recommendations,
  };
}
