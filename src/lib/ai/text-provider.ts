import type { ContentText, GenerationOptions } from "@/lib/content/validation";
export type ProductContext = {
  name: string;
  description: string | null;
  features: string | null;
  price: string | null;
  platform: string;
  affiliateUrl: string | null;
};
export type GenerateContentInput = {
  product: ProductContext;
  options: GenerationOptions;
};
export type GeneratedContent = {
  text: ContentText;
  provider: string;
  model: string;
};
export interface AITextProvider {
  generateContent(input: GenerateContentInput): Promise<GeneratedContent>;
}
