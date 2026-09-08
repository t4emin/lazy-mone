import { z } from "zod";
export const contentTypeLabels = {
  review: "Product Review",
  short_review: "Short Review",
  recommendation: "Product Recommendation",
  comparison: "Comparison",
  promotion: "Promotion",
  educational: "Educational",
} as const;
export const targetPlatformLabels = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  shopee: "Shopee",
  generic: "Generic",
} as const;
export const languageLabels = { th: "ไทย", en: "English" } as const;
export const toneLabels = {
  friendly: "เป็นกันเอง",
  professional: "มืออาชีพ",
  enthusiastic: "กระตือรือร้น",
  straightforward: "ตรงประเด็น",
} as const;
export const generationOptionsSchema = z
  .object({
    contentType: z.enum([
      "review",
      "short_review",
      "recommendation",
      "comparison",
      "promotion",
      "educational",
    ]),
    targetPlatform: z.enum([
      "facebook",
      "tiktok",
      "instagram",
      "shopee",
      "generic",
    ]),
    language: z.enum(["th", "en"]),
    tone: z.enum([
      "friendly",
      "professional",
      "enthusiastic",
      "straightforward",
    ]),
    targetAudience: z.string().trim().max(500),
    additionalInstructions: z.string().trim().max(2000),
  })
  .strict();
export const contentTextSchema = z
  .object({
    hook: z.string().trim().min(1).max(1000),
    script: z.string().trim().min(1).max(12000),
    caption: z.string().trim().min(1).max(5000),
    cta: z.string().trim().min(1).max(1000),
    hashtags: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
  })
  .strict();
export const editContentSchema = contentTextSchema
  .extend({
    status: z.enum(["draft", "ready"]),
    version: z.number().int().positive(),
  })
  .strict();
export type GenerationOptions = z.infer<typeof generationOptionsSchema>;
export type ContentText = z.infer<typeof contentTextSchema>;
export type EditContent = z.infer<typeof editContentSchema>;
export const defaultGenerationOptions: GenerationOptions = {
  contentType: "review",
  targetPlatform: "facebook",
  language: "th",
  tone: "friendly",
  targetAudience: "",
  additionalInstructions: "",
};
