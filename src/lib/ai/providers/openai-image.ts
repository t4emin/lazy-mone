import { z } from "zod";
import { ProductError } from "@/lib/products/errors";
import type {
  AIImageProvider,
  GenerateImageInput,
  GeneratedImage,
} from "../image-provider";

const responseSchema = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) })).min(1),
});
const sizes = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
} as const;
export class OpenAIImageProvider implements AIImageProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private transport: typeof fetch = fetch,
  ) {}
  async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
    let response: Response;
    try {
      if (input.references.length) {
        const form = new FormData();
        form.set("model", this.model);
        form.set("prompt", input.prompt);
        form.set("size", sizes[input.aspectRatio]);
        input.references.forEach((image) =>
          form.append(
            "image[]",
            new Blob([new Uint8Array(image.data)], { type: image.mimeType }),
            image.fileName,
          ),
        );
        response = await this.transport(
          "https://api.openai.com/v1/images/edits",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}` },
            body: form,
            signal: AbortSignal.timeout(120_000),
            cache: "no-store",
          },
        );
      } else {
        response = await this.transport(
          "https://api.openai.com/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: this.model,
              prompt: input.prompt,
              size: sizes[input.aspectRatio],
              quality: "low",
            }),
            signal: AbortSignal.timeout(120_000),
            cache: "no-store",
          },
        );
      }
    } catch {
      throw new ProductError(
        504,
        "ติดต่อ AI สร้างภาพไม่สำเร็จหรือใช้เวลานานเกินกำหนด กรุณาลองใหม่",
      );
    }
    if (!response.ok) {
      if ([401, 403].includes(response.status))
        throw new ProductError(
          503,
          "AI ปฏิเสธ API Key หรือสิทธิ์ใช้งาน กรุณาตรวจการตั้งค่าที่ Server",
        );
      if (response.status === 429)
        throw new ProductError(
          429,
          "AI ถูกจำกัดการใช้งานหรือโควตาไม่เพียงพอ กรุณาลองใหม่ภายหลัง",
        );
      throw new ProductError(
        502,
        "AI สร้างภาพไม่สำเร็จ หรือไม่รองรับ Model/ขนาดภาพที่ตั้งไว้",
      );
    }
    try {
      return {
        data: Buffer.from(
          responseSchema.parse(await response.json()).data[0].b64_json,
          "base64",
        ),
        provider: "openai",
        model: this.model,
      };
    } catch {
      throw new ProductError(502, "AI ส่งไฟล์ภาพไม่ถูกต้อง จึงยังไม่ได้บันทึก");
    }
  }
}
