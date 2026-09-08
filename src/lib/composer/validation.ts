import { z } from "zod";

export const composeVideoSchema = z.object({
  imageAssetIds: z.array(z.string().cuid()).min(1).max(8),
  audioAssetId: z.string().cuid().optional(),
  text: z.string().trim().max(300),
  durationSeconds: z.coerce.number().int().min(2).max(10),
  aspectRatio: z.enum(["9:16", "16:9"]),
  effect: z.enum(["fade", "zoom"]),
});
export type ComposeVideoInput = z.infer<typeof composeVideoSchema>;
