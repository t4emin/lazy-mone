import { z } from "zod";
export const videoAspectRatios = ["9:16", "16:9"] as const;
export const createVideoJobSchema = z.object({
  prompt: z.string().trim().min(10).max(4000),
  durationSeconds: z.union([z.literal(5), z.literal(10)]),
  aspectRatio: z.enum(videoAspectRatios),
  referenceAssetId: z.string().cuid().optional(),
});
export type CreateVideoJobInput = z.infer<typeof createVideoJobSchema>;
