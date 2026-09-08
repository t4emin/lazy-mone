import "server-only";
import { getDb } from "@/lib/db";
import { getVideoProvider, getVideoAIConfiguration } from "@/lib/ai/ai-service";
import { getAssetStorage } from "@/lib/storage/storage";
import { ProductError } from "@/lib/products/errors";
import type { AIVideoProvider } from "./provider";
import type { CreateVideoJobInput } from "./validation";

export function listVideoJobs(userId: string, contentId: string) {
  return getDb().videoJob.findMany({
    where: { userId, contentId, content: { product: { userId } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
async function owned(userId: string, id: string) {
  const job = await getDb().videoJob.findFirst({
    where: { id, userId, content: { product: { userId } } },
  });
  if (!job) throw new ProductError(404, "ไม่พบงานสร้างวิดีโอ");
  return job;
}
export async function createVideoJob(
  userId: string,
  contentId: string,
  input: CreateVideoJobInput,
  provider?: AIVideoProvider,
) {
  const content = await getDb().contentDraft.findFirst({
    where: { id: contentId, userId, product: { userId } },
  });
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  const reference = input.referenceAssetId
    ? await getDb().productAsset.findFirst({
        where: { id: input.referenceAssetId, productId: content.productId },
      })
    : null;
  if (input.referenceAssetId && !reference)
    throw new ProductError(400, "รูปอ้างอิงต้องเป็น Asset ของสินค้าเดียวกัน");
  const config = getVideoAIConfiguration();
  const job = await getDb().videoJob.create({
    data: {
      userId,
      productId: content.productId,
      contentId,
      provider: config.provider,
      model: config.model,
      prompt: input.prompt,
      durationSeconds: input.durationSeconds,
      aspectRatio: input.aspectRatio,
      referenceAssetId: reference?.id,
    },
  });
  try {
    const update = await (provider ?? getVideoProvider()).create({
      prompt: input.prompt,
      durationSeconds: input.durationSeconds,
      aspectRatio: input.aspectRatio,
      reference: reference
        ? {
            data: await getAssetStorage().read(reference.filePath),
            fileName: reference.fileName,
            mimeType: reference.mimeType,
          }
        : undefined,
    });
    return await getDb().videoJob.update({
      where: { id: job.id },
      data: {
        providerJobId: update.providerJobId,
        status: update.status,
        progress: update.progress,
        estimatedCost: update.estimatedCost,
        errorMessage: update.errorMessage ?? null,
      },
    });
  } catch (error) {
    await getDb().videoJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "สร้างวิดีโอไม่สำเร็จ",
      },
    });
    throw error;
  }
}
export async function refreshVideoJob(
  userId: string,
  id: string,
  provider?: AIVideoProvider,
) {
  const job = await owned(userId, id);
  if (!job.providerJobId)
    throw new ProductError(409, "งานนี้ยังไม่มีรหัสจาก Provider");
  const update = await (provider ?? getVideoProvider()).retrieve(
    job.providerJobId,
  );
  let outputAssetId = job.outputAssetId;
  if (update.status === "completed" && !outputAssetId) {
    const bytes = await (provider ?? getVideoProvider()).download(
      job.providerJobId,
    );
    const path = await getAssetStorage().put(bytes, "mp4");
    try {
      const asset = await getDb().productAsset.create({
        data: {
          productId: job.productId,
          contentId: job.contentId,
          type: "video",
          filePath: path,
          fileName: `video-${job.id}.mp4`,
          mimeType: "video/mp4",
          fileSize: bytes.length,
          aiProvider: job.provider,
          aiModel: job.model,
          prompt: job.prompt,
          aspectRatio: job.aspectRatio,
        },
      });
      outputAssetId = asset.id;
    } catch (e) {
      await getAssetStorage().remove(path);
      throw e;
    }
  }
  return getDb().videoJob.update({
    where: { id },
    data: {
      status: update.status,
      progress: update.progress,
      ...(update.estimatedCost !== undefined
        ? { estimatedCost: update.estimatedCost }
        : {}),
      errorMessage: update.errorMessage ?? null,
      outputAssetId,
    },
  });
}
export async function retryVideoJob(
  userId: string,
  id: string,
  provider?: AIVideoProvider,
) {
  const old = await owned(userId, id);
  if (old.status !== "failed")
    throw new ProductError(409, "Retry ได้เฉพาะงานที่ล้มเหลว");
  return createVideoJob(
    userId,
    old.contentId,
    {
      prompt: old.prompt,
      durationSeconds: old.durationSeconds as 5 | 10,
      aspectRatio: old.aspectRatio as "9:16" | "16:9",
      ...(old.referenceAssetId
        ? { referenceAssetId: old.referenceAssetId }
        : {}),
    },
    provider,
  );
}
