import { z } from "zod";
import https from "node:https";
import { ProductError } from "@/lib/products/errors";
import type {
  AIVideoProvider,
  VideoJobUpdate,
  VideoRequest,
} from "../provider";

const taskSchema = z.object({
  id: z.string().min(1),
  status: z.string(),
  progress: z.number().optional(),
  estimatedCost: z.object({ credits: z.number().nonnegative() }).optional(),
  output: z.array(z.string().url()).optional(),
  failure: z.string().optional(),
});
const createdTaskSchema = z.object({
  id: z.string().min(1),
  estimatedCost: z.object({ credits: z.number().nonnegative() }).optional(),
});
function toUpdate(task: z.infer<typeof taskSchema>): VideoJobUpdate {
  const status =
    task.status === "SUCCEEDED"
      ? "completed"
      : task.status === "FAILED" || task.status === "CANCELLED"
        ? "failed"
        : task.status === "RUNNING"
          ? "processing"
          : "pending";
  return {
    providerJobId: task.id,
    status,
    progress:
      status === "completed"
        ? 100
        : Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (task.progress ?? 0) <= 1
                  ? (task.progress ?? 0) * 100
                  : (task.progress ?? 0),
              ),
            ),
          ),
    errorMessage: task.failure,
    estimatedCost: task.estimatedCost?.credits,
  };
}
export class RunwayVideoProvider implements AIVideoProvider {
  constructor(
    private key: string,
    private model: string,
    private transport: typeof fetch = fetch,
  ) {}
  private async call(path: string, init?: RequestInit) {
    let response: Response;
    try {
      response = await new Promise<Response>((resolve, reject) => {
        const body = init?.body ? String(init.body) : undefined;
        const requestHeaders: Record<string, string | number> = {
          Authorization: `Bearer ${this.key}`,
          "X-Runway-Version": "2024-11-06",
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        };
        const request = https.request(
          `https://api.dev.runwayml.com/v1${path}`,
          {
            method: init?.method ?? "GET",
            headers: requestHeaders,
            timeout: 60_000,
          },
          (incoming) => {
            const chunks: Buffer[] = [];
            incoming.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            incoming.on("end", () =>
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: incoming.statusCode ?? 502,
                  headers: incoming.headers as HeadersInit,
                }),
              ),
            );
          },
        );
        request.on("timeout", () => request.destroy(new Error("timeout")));
        request.on("error", reject);
        if (body) request.write(body);
        request.end();
      });
    } catch {
      throw new ProductError(504, "ติดต่อ Runway ไม่สำเร็จ กรุณาลองใหม่");
    }
    if (!response.ok) {
      if (response.status === 429)
        throw new ProductError(429, "Runway ถูกจำกัดการใช้งานหรือโควตาไม่พอ");
      if ([401, 403].includes(response.status))
        throw new ProductError(503, "Runway ปฏิเสธ API Key หรือสิทธิ์ใช้งาน");
      throw new ProductError(502, "Runway ไม่พร้อมใช้งานหรือ Model ไม่รองรับ");
    }
    return response;
  }
  async create(input: VideoRequest) {
    const promptImage = input.reference
      ? `data:${input.reference.mimeType};base64,${input.reference.data.toString("base64")}`
      : undefined;
    const response = await this.call("/image_to_video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        promptText: input.prompt,
        promptImage,
        ratio: input.aspectRatio === "9:16" ? "720:1280" : "1280:720",
        duration: input.durationSeconds,
      }),
    });
    try {
      const created = createdTaskSchema.parse(await response.json());
      return {
        providerJobId: created.id,
        status: "pending" as const,
        progress: 0,
        estimatedCost: created.estimatedCost?.credits,
      };
    } catch {
      throw new ProductError(502, "Runway ส่งสถานะงานไม่ถูกต้อง");
    }
  }
  async retrieve(id: string) {
    const response = await this.call(`/tasks/${encodeURIComponent(id)}`);
    try {
      return toUpdate(taskSchema.parse(await response.json()));
    } catch {
      throw new ProductError(502, "Runway ส่งสถานะงานไม่ถูกต้อง");
    }
  }
  async download(id: string) {
    const response = await this.call(`/tasks/${encodeURIComponent(id)}`);
    const task = taskSchema.parse(await response.json());
    const url = task.output?.[0];
    if (!url) throw new ProductError(409, "วิดีโอยังไม่พร้อมดาวน์โหลด");
    const file = await fetch(url, {
      signal: AbortSignal.timeout(120_000),
      cache: "no-store",
    });
    if (!file.ok)
      throw new ProductError(502, "ดาวน์โหลดวิดีโอจาก Runway ไม่สำเร็จ");
    return Buffer.from(await file.arrayBuffer());
  }
}
