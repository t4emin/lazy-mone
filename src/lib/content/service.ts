import "server-only";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import { removeStoredFiles } from "@/lib/storage/storage";
import type { EditContent } from "./validation";

export function listContents(userId: string) {
  return getDb().contentDraft.findMany({
    where: { userId, product: { userId } },
    include: { product: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
export function findContent(userId: string, id: string) {
  return getDb().contentDraft.findFirst({
    where: { id, userId, product: { userId } },
    include: {
      product: {
        include: {
          assets: {
            where: { type: { in: ["product_image", "generated_image"] } },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
}
export function countDrafts(userId: string) {
  return getDb().contentDraft.count({
    where: { userId, status: "draft", product: { userId } },
  });
}
export async function updateContent(
  userId: string,
  id: string,
  input: EditContent,
) {
  const { version, ...data } = input;
  const result = await getDb().contentDraft.updateMany({
    where: { id, userId, product: { userId }, version },
    data: { ...data, version: { increment: 1 } },
  });
  if (!result.count) {
    if (!(await findContent(userId, id)))
      throw new ProductError(404, "ไม่พบคอนเทนต์");
    throw new ProductError(
      409,
      "คอนเทนต์ถูกแก้ไขจากหน้าอื่นแล้ว กรุณาคัดลอกข้อความที่แก้ไว้และ Refresh ก่อนบันทึกใหม่",
    );
  }
}
export async function deleteContent(userId: string, id: string) {
  const files = await getDb().$transaction(async (tx) => {
    const content = await tx.contentDraft.findFirst({
      where: { id, userId, product: { userId } },
    });
    if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
    const assets = await tx.productAsset.findMany({
      where: {
        contentId: id,
        type: { in: ["generated_image", "audio", "video"] },
      },
      select: { filePath: true },
    });
    await tx.productAsset.deleteMany({
      where: {
        contentId: id,
        type: { in: ["generated_image", "audio", "video"] },
      },
    });
    await tx.contentDraft.delete({ where: { id } });
    return assets.map((asset) => asset.filePath);
  });
  await removeStoredFiles(files);
}
