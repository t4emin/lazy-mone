import { z } from "zod";
import { contentTextSchema } from "@/lib/content/validation";
import { ProductError } from "@/lib/products/errors";
import { buildContentInput, contentInstructions } from "../prompt";
import type {
  AITextProvider,
  GenerateContentInput,
  GeneratedContent,
} from "../text-provider";

const envelopeSchema = z.object({
  status: z.string(),
  model: z.string().min(1).max(200),
  output: z.array(
    z.object({
      type: z.string(),
      content: z
        .array(z.object({ type: z.string(), text: z.string().optional() }))
        .optional(),
    }),
  ),
});
export class OpenAITextProvider implements AITextProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private transport: typeof fetch = fetch,
  ) {}
  async generateContent(
    input: GenerateContentInput,
  ): Promise<GeneratedContent> {
    let response: Response;
    try {
      response = await this.transport("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(90_000),
        cache: "no-store",
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions: contentInstructions,
          input: buildContentInput(input),
          max_output_tokens: 6000,
          text: {
            format: {
              type: "json_schema",
              name: "affiliate_content",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  hook: { type: "string" },
                  script: { type: "string" },
                  caption: { type: "string" },
                  cta: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                },
                required: ["hook", "script", "caption", "cta", "hashtags"],
              },
            },
          },
        }),
      });
    } catch {
      throw new ProductError(
        504,
        "ติดต่อ AI ไม่สำเร็จหรือใช้เวลานานเกินกำหนด กรุณาลองใหม่ภายหลัง",
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
          "AI ถูกจำกัดการใช้งานหรือโควตาไม่เพียงพอ กรุณาตรวจบัญชี AI แล้วลองใหม่",
        );
      throw new ProductError(
        502,
        "AI ไม่พร้อมใช้งาน หรือไม่รองรับ Model ที่ตั้งไว้ กรุณาลองใหม่ภายหลัง",
      );
    }
    try {
      const data = envelopeSchema.parse(await response.json());
      if (data.status !== "completed") throw new Error("Incomplete generation");
      const parts = data.output.flatMap((item) =>
        item.type === "message" ? (item.content ?? []) : [],
      );
      if (parts.some((part) => part.type === "refusal"))
        throw new Error("Refused");
      const raw = parts
        .filter((part) => part.type === "output_text")
        .map((part) => part.text ?? "")
        .join("");
      return {
        text: contentTextSchema.parse(JSON.parse(raw)),
        provider: "openai",
        model: data.model,
      };
    } catch {
      throw new ProductError(
        502,
        "AI ส่งข้อความไม่ครบหรือรูปแบบไม่ถูกต้อง จึงยังไม่ได้บันทึก กรุณาปรับคำสั่งแล้วลองใหม่",
      );
    }
  }
}
