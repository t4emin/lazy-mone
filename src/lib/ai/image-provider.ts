export type ImageAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export interface ImageReference {
  data: Buffer;
  fileName: string;
  mimeType: string;
}
export interface GenerateImageInput {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  references: ImageReference[];
}
export interface GeneratedImage {
  data: Buffer;
  provider: string;
  model: string;
}
export interface AIImageProvider {
  generateImage(input: GenerateImageInput): Promise<GeneratedImage>;
}
