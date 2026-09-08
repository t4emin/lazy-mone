import { z } from "zod";
import { ProductError } from "@/lib/products/errors";
import type { AIVideoProvider, VideoJobUpdate, VideoRequest } from "@/lib/video/provider";
const jobSchema = z.object({ id: z.string().min(1), status: z.enum(["queued", "in_progress", "completed", "failed"]), progress: z.number().min(0).max(100).default(0), error: z.object({ message: z.string() }).nullable().optional() });
const sizes = { "9:16": "720x1280", "16:9": "1280x720" } as const;
function status(data: z.infer<typeof jobSchema>): VideoJobUpdate { return { providerJobId: data.id, status: data.status === "queued" ? "pending" : data.status === "in_progress" ? "processing" : data.status, progress: data.progress, errorMessage: data.error?.message }; }
export class OpenAIVideoProvider implements AIVideoProvider {
  constructor(private key: string, private model: string, private transport: typeof fetch = fetch) {}
  private async request(path: string, init?: RequestInit) { let res: Response; try { res=await this.transport(`https://api.openai.com/v1/videos${path}`,{...init,headers:{Authorization:`Bearer ${this.key}`,...init?.headers},signal:AbortSignal.timeout(60_000),cache:"no-store"}); } catch { throw new ProductError(504,"ติดต่อ AI Video ไม่สำเร็จ กรุณาลองใหม่"); } if(!res.ok){if(res.status===429)throw new ProductError(429,"AI Video ถูกจำกัดการใช้งานหรือโควตาไม่พอ"); if([401,403].includes(res.status))throw new ProductError(503,"AI Video ปฏิเสธ API Key หรือสิทธิ์ใช้งาน"); throw new ProductError(502,"AI Video ไม่พร้อมใช้งานหรือ Model ไม่รองรับ");} return res; }
  async create(input: VideoRequest) { const body={model:this.model,prompt:input.prompt,seconds:String(input.durationSeconds),size:sizes[input.aspectRatio]}; const res=await this.request("",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); try{return status(jobSchema.parse(await res.json()));}catch{throw new ProductError(502,"AI Video ส่งสถานะงานไม่ถูกต้อง");} }
  async retrieve(id: string) { const res=await this.request(`/${encodeURIComponent(id)}`);try{return status(jobSchema.parse(await res.json()));}catch{throw new ProductError(502,"AI Video ส่งสถานะงานไม่ถูกต้อง");} }
  async download(id: string) { const res=await this.request(`/${encodeURIComponent(id)}/content`);return Buffer.from(await res.arrayBuffer()); }
}
