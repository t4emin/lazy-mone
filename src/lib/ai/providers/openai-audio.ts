import { ProductError } from "@/lib/products/errors";
import type {
  AIAudioProvider,
  GenerateAudioInput,
  GeneratedAudio,
} from "../audio-provider";

export class OpenAIAudioProvider implements AIAudioProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private transport: typeof fetch = fetch,
  ) {}

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedAudio> {
    let response: Response;
    try {
      response = await this.transport(
        "https://api.openai.com/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            input: input.text,
            voice: input.voice,
            speed: input.speed,
            response_format: "mp3",
            instructions: `Speak naturally in ${input.language}.`,
          }),
          signal: AbortSignal.timeout(120_000),
          cache: "no-store",
        },
      );
    } catch {
      throw new ProductError(504, "ติดต่อ AI สร้างเสียงไม่สำเร็จ กรุณาลองใหม่");
    }
    if (!response.ok) {
      if ([401, 403].includes(response.status))
        throw new ProductError(503, "AI ปฏิเสธ API Key หรือสิทธิ์ใช้งาน");
      if (response.status === 429)
        throw new ProductError(429, "AI ถูกจำกัดการใช้งานหรือโควตาไม่พอ");
      throw new ProductError(502, "AI สร้างเสียงไม่สำเร็จ กรุณาลองใหม่");
    }
    const data = Buffer.from(await response.arrayBuffer());
    if (!data.length || data.length > 50 * 1024 * 1024)
      throw new ProductError(502, "AI ส่งไฟล์เสียงขนาดไม่ถูกต้อง");
    return { data, provider: "openai", model: this.model };
  }
}
