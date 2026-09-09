import "server-only";
import { getDb } from "@/lib/db";

export type AIUsageRecord = {
  userId: string;
  type: "text" | "image" | "video" | "voice";
  provider: string;
  model: string;
  inputUsage?: string;
  outputUsage?: string;
  estimatedCost?: number;
  costUnit?: string;
};

export function recordAIUsage(record: AIUsageRecord) {
  return getDb().aIUsage.create({
    data: {
      ...record,
      estimatedCost: record.estimatedCost,
    },
  });
}

export async function getAIUsageSummary(userId: string) {
  const rows = await getDb().aIUsage.groupBy({
    by: ["type"],
    where: { userId },
    _count: { _all: true },
    _sum: { estimatedCost: true },
  });
  const counts = new Map(rows.map((row) => [row.type, row._count._all]));
  const credits = rows.reduce(
    (total, row) => total + Number(row._sum.estimatedCost?.toString() ?? 0),
    0,
  );
  return {
    text: counts.get("text") ?? 0,
    image: counts.get("image") ?? 0,
    video: counts.get("video") ?? 0,
    voice: counts.get("voice") ?? 0,
    knownCost: credits,
  };
}

export function listAIUsage(userId: string) {
  return getDb().aIUsage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
