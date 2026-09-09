import "server-only";
import { getDb } from "@/lib/db";
import { getAssetStorage, removeStoredFiles } from "@/lib/storage/storage";
import { getImageProvider } from "@/lib/ai/ai-service";
import type { AIImageProvider } from "@/lib/ai/image-provider";
import { ProductError } from "@/lib/products/errors";
import { assertBudgetAvailable } from "@/lib/budget/service";
import type { ImageGenerationInput } from "./validation";

const activeUsers = new Set<string>();
export function listContentAssets(userId: string, contentId: string) {
  return getDb().productAsset.findMany({
    where: {
      contentId,
      type: "generated_image",
      product: { userId },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export function listContentPreviewAssets(userId: string, contentId: string) {
  return getDb().productAsset.findMany({
    where: {
      contentId,
      type: { in: ["generated_image", "video", "audio"] },
      product: { userId },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
export async function generateContentImage(
  userId: string,
  contentId: string,
  input: ImageGenerationInput,
  provider?: AIImageProvider,
) {
  const db = getDb();
  const content = await db.contentDraft.findFirst({
    where: { id: contentId, userId, product: { userId } },
    include: { product: true },
  });
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  if (activeUsers.has(userId))
    throw new ProductError(409, "กำลังสร้างภาพอยู่ กรุณารอให้เสร็จก่อน");
  const references = input.referenceAssetIds.length
    ? await db.productAsset.findMany({
        where: {
          id: { in: input.referenceAssetIds },
          productId: content.productId,
          type: { in: ["product_image", "generated_image"] },
        },
      })
    : [];
  if (references.length !== input.referenceAssetIds.length)
    throw new ProductError(
      400,
      "รูปอ้างอิงต้องเป็นรูปสินค้าหรือภาพ AI ของสินค้าเดียวกัน",
    );
  await assertBudgetAvailable(userId);
  activeUsers.add(userId);
  try {
    const generated = await (provider ?? getImageProvider()).generateImage({
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      references: await Promise.all(
        references.map(async (asset) => ({
          data: await getAssetStorage().read(asset.filePath),
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        })),
      ),
    });
    if (!generated.data.length || generated.data.length > 20 * 1024 * 1024)
      throw new ProductError(
        502,
        "AI ส่งไฟล์ภาพขนาดไม่ถูกต้อง จึงยังไม่ได้บันทึก",
      );
    const filePath = await getAssetStorage().put(generated.data, "png");
    try {
      return await db.$transaction(async (tx) => {
        const exists = await tx.contentDraft.findFirst({
          where: { id: contentId, userId, product: { userId } },
        });
        if (!exists)
          throw new ProductError(
            409,
            "คอนเทนต์ถูกลบระหว่างสร้างภาพ จึงบันทึกไม่ได้",
          );
        const asset = await tx.productAsset.create({
          data: {
            productId: content.productId,
            contentId,
            type: "generated_image",
            filePath,
            fileName: `ai-${Date.now()}.png`,
            mimeType: "image/png",
            fileSize: generated.data.length,
            prompt: input.prompt,
            aspectRatio: input.aspectRatio,
            aiProvider: generated.provider,
            aiModel: generated.model,
          },
        });
        await tx.aIUsage.create({
          data: {
            userId,
            type: "image",
            provider: generated.provider,
            model: generated.model,
            inputUsage: `${input.prompt.length} prompt characters`,
            outputUsage: `${generated.data.length} bytes`,
          },
        });
        return asset;
      });
    } catch (error) {
      await removeStoredFiles([filePath]);
      throw error;
    }
  } finally {
    activeUsers.delete(userId);
  }
}
export async function deleteContentAsset(
  userId: string,
  contentId: string,
  assetId: string,
) {
  const asset = await getDb().productAsset.findFirst({
    where: {
      id: assetId,
      contentId,
      type: "generated_image",
      product: { userId },
    },
  });
  if (!asset) throw new ProductError(404, "ไม่พบภาพ AI");
  await getDb().productAsset.delete({ where: { id: asset.id } });
  await removeStoredFiles([asset.filePath]);
}
