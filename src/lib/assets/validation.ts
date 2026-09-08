import { z } from "zod";
export const aspectRatios = ["1:1", "4:5", "9:16", "16:9"] as const;
export const imageGenerationSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt ต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(4000),
  aspectRatio: z.enum(aspectRatios),
  referenceAssetIds: z.array(z.string().cuid()).max(4),
});
export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;
