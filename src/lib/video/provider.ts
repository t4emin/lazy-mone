export interface VideoRequest {
  prompt: string;
  durationSeconds: 5 | 10;
  aspectRatio: "9:16" | "16:9";
  reference?: { data: Buffer; fileName: string; mimeType: string };
}
export interface VideoJobUpdate {
  providerJobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  estimatedCost?: number;
  errorMessage?: string;
}
export interface AIVideoProvider {
  create(request: VideoRequest): Promise<VideoJobUpdate>;
  retrieve(providerJobId: string): Promise<VideoJobUpdate>;
  download(providerJobId: string): Promise<Buffer>;
}
