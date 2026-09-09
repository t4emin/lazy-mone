import { z } from "zod";
const metric = z.number().int().min(0).max(2_000_000_000);
export const analyticsSchema = z
  .object({
    contentId: z.string().cuid(),
    platform: z.string().trim().min(1).max(50),
    collectedOn: z.string().date(),
    views: metric,
    likes: metric,
    comments: metric,
    shares: metric,
    clicks: metric,
    orders: metric,
    commission: z.number().min(0).max(1_000_000),
  })
  .strict();
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
