import "server-only";
import { getDb } from "@/lib/db";
import { getAudioProvider } from "@/lib/ai/ai-service";
import type { AIAudioProvider } from "@/lib/ai/audio-provider";
import { ProductError } from "@/lib/products/errors";
import { getAssetStorage, removeStoredFiles } from "@/lib/storage/storage";
import type { GenerateAudioInput } from "./validation";
import { recordAIUsage } from "@/lib/usage/service";

const activeUsers = new Set<string>();

export function listAudioAssets(userId: string, contentId: string) {
  return getDb().productAsset.findMany({
    where: { contentId, type: "audio", product: { userId } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function generateContentAudio(
  userId: string,
  contentId: string,
  input: GenerateAudioInput,
  provider?: AIAudioProvider,
) {
  const content = await getDb().contentDraft.findFirst({
    where: { id: contentId, userId, product: { userId } },
  });
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  if (activeUsers.has(userId))
    throw new ProductError(409, "กำลังสร้างเสียงอยู่ กรุณารอให้เสร็จก่อน");
  activeUsers.add(userId);
  try {
    const generated = await (provider ?? getAudioProvider()).generateAudio(
      input,
    );
    const filePath = await getAssetStorage().put(generated.data, "mp3");
    try {
      const asset = await getDb().productAsset.create({
        data: {
          productId: content.productId,
          contentId,
          type: "audio",
          filePath,
          fileName: `voice-${Date.now()}.mp3`,
          mimeType: "audio/mpeg",
          fileSize: generated.data.length,
          prompt: input.text,
          aiProvider: generated.provider,
          aiModel: generated.model,
          voice: input.voice,
          language: input.language,
          speed: input.speed,
        },
      });
      await recordAIUsage({
        userId,
        type: "voice",
        provider: generated.provider,
        model: generated.model,
        inputUsage: `${input.text.length} characters`,
        outputUsage: `${generated.data.length} bytes`,
      });
      return asset;
    } catch (error) {
      await getAssetStorage().remove(filePath);
      throw error;
    }
  } finally {
    activeUsers.delete(userId);
  }
}

export async function deleteContentAudio(
  userId: string,
  contentId: string,
  assetId: string,
) {
  const asset = await getDb().productAsset.findFirst({
    where: { id: assetId, contentId, type: "audio", product: { userId } },
  });
  if (!asset) throw new ProductError(404, "ไม่พบไฟล์เสียง");
  await getDb().productAsset.delete({ where: { id: asset.id } });
  await removeStoredFiles([asset.filePath]);
}
