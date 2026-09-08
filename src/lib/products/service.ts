import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { getAssetStorage, removeStoredFiles } from "@/lib/storage/storage";
import { ProductError } from "./errors";
import { prepareImage } from "./image-validation";
import {
  MAX_PRODUCT_IMAGES,
  MAX_UPLOAD_FILES,
  type ProductInput,
} from "./validation";

const assetOrder = [{ createdAt: "asc" as const }, { id: "asc" as const }];
export function listProducts(userId: string) {
  return getDb().product.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
export function countProducts(userId: string) {
  return getDb().product.count({ where: { userId } });
}
export function findProduct(userId: string, id: string) {
  return getDb().product.findFirst({
    where: { id, userId },
    include: { assets: { orderBy: [{ isPrimary: "desc" }, ...assetOrder] } },
  });
}
export function createProduct(userId: string, data: ProductInput) {
  return getDb().product.create({ data: { ...data, userId } });
}
export async function updateProduct(
  userId: string,
  id: string,
  data: ProductInput,
) {
  const result = await getDb().product.updateMany({
    where: { id, userId },
    data,
  });
  if (!result.count) throw new ProductError(404, "ไม่พบสินค้า");
}

async function lockProduct(
  tx: Prisma.TransactionClient,
  userId: string,
  id: string,
) {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT "id" FROM "Product" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`;
  if (!rows.length) throw new ProductError(404, "ไม่พบสินค้า");
}

export async function deleteProduct(userId: string, id: string) {
  const files = await getDb().$transaction(async (tx) => {
    await lockProduct(tx, userId, id);
    if (await tx.contentDraft.count({ where: { productId: id } }))
      throw new ProductError(
        409,
        "สินค้านี้มีคอนเทนต์อยู่ กรุณาลบคอนเทนต์ที่เกี่ยวข้องจากหน้า Content ก่อนลบสินค้า",
      );
    const assets = await tx.productAsset.findMany({
      where: { productId: id },
      select: { filePath: true },
    });
    await tx.product.delete({ where: { id } });
    return assets.map((asset) => asset.filePath);
  });
  await removeStoredFiles(files);
}

export async function uploadProductImages(
  userId: string,
  productId: string,
  files: File[],
) {
  if (!files.length || files.length > MAX_UPLOAD_FILES)
    throw new ProductError(400, "เลือกอัปโหลดครั้งละ 1–5 รูป");
  if (!(await findProduct(userId, productId)))
    throw new ProductError(404, "ไม่พบสินค้า");
  const storage = getAssetStorage();
  const stored: {
    filePath: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }[] = [];
  try {
    // Serial processing bounds decoder memory and allows rollback of the whole batch.
    for (const file of files) {
      const image = await prepareImage(file);
      const filePath = await storage.put(image.data, image.extension);
      stored.push({
        filePath,
        fileName: image.fileName,
        mimeType: image.mimeType,
        fileSize: image.fileSize,
      });
    }
    await getDb().$transaction(async (tx) => {
      await lockProduct(tx, userId, productId);
      const count = await tx.productAsset.count({ where: { productId } });
      if (count + stored.length > MAX_PRODUCT_IMAGES)
        throw new ProductError(400, "แต่ละสินค้าเก็บรูปได้ไม่เกิน 10 รูป");
      for (const [index, asset] of stored.entries()) {
        await tx.productAsset.create({
          data: { ...asset, productId, isPrimary: count === 0 && index === 0 },
        });
      }
      await tx.product.update({
        where: { id: productId },
        data: { updatedAt: new Date() },
      });
    });
  } catch (error) {
    await removeStoredFiles(stored.map((asset) => asset.filePath));
    throw error;
  }
}

export async function changeProductImage(
  userId: string,
  productId: string,
  assetId: string,
  operation: "primary" | "delete",
) {
  const removed = await getDb().$transaction(async (tx) => {
    await lockProduct(tx, userId, productId);
    const asset = await tx.productAsset.findFirst({
      where: { id: assetId, productId },
    });
    if (!asset) throw new ProductError(404, "ไม่พบรูปสินค้า");
    if (operation === "primary") {
      await tx.productAsset.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
      await tx.productAsset.update({
        where: { id: assetId },
        data: { isPrimary: true },
      });
    } else {
      await tx.productAsset.delete({ where: { id: assetId } });
      if (asset.isPrimary) {
        const next = await tx.productAsset.findFirst({
          where: { productId },
          orderBy: assetOrder,
        });
        if (next)
          await tx.productAsset.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
      }
    }
    await tx.product.update({
      where: { id: productId },
      data: { updatedAt: new Date() },
    });
    return operation === "delete" ? asset.filePath : null;
  });
  if (removed) await removeStoredFiles([removed]);
}

export async function readProductImage(userId: string, id: string) {
  const asset = await getDb().productAsset.findFirst({
    where: { id, product: { userId } },
  });
  if (!asset) throw new ProductError(404, "ไม่พบรูปสินค้า");
  try {
    return {
      data: await getAssetStorage().read(asset.filePath),
      mimeType: asset.mimeType,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new ProductError(404, "ไม่พบไฟล์รูป");
    throw error;
  }
}
