import "server-only";
import { getDb } from "@/lib/db";
import { getTextProvider } from "@/lib/ai/ai-service";
import type { AITextProvider } from "@/lib/ai/text-provider";
import { ProductError } from "@/lib/products/errors";
import { assertBudgetAvailable } from "@/lib/budget/service";
import { contentTextSchema, type GenerationOptions } from "./validation";

// Bound simultaneous paid requests per user in this single-process MVP.
const activeUsers = new Set<string>();
export async function generateDraft(
  userId: string,
  productId: string,
  options: GenerationOptions,
  provider?: AITextProvider,
) {
  const db = getDb();
  const product = await db.product.findFirst({
    where: { id: productId, userId },
  });
  if (!product) throw new ProductError(404, "ไม่พบสินค้า");
  if (activeUsers.has(userId))
    throw new ProductError(409, "กำลังสร้างคอนเทนต์อยู่ กรุณารอให้เสร็จก่อน");
  const adapter = provider ?? getTextProvider();
  await assertBudgetAvailable(userId);
  activeUsers.add(userId);
  try {
    const generated = await adapter.generateContent({
      product: {
        name: product.name,
        description: product.description,
        features: product.features,
        price: product.price?.toString() ?? null,
        platform: product.platform,
        affiliateUrl: product.affiliateUrl,
      },
      options,
    });
    const text = contentTextSchema.parse(generated.text);
    // Recheck ownership and existence after the network call; serialize with product deletion.
    return await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "Product" WHERE "id" = ${productId} AND "userId" = ${userId} FOR UPDATE`;
      if (!rows.length)
        throw new ProductError(
          409,
          "สินค้าถูกลบหรือเปลี่ยนเจ้าของระหว่างสร้างคอนเทนต์ จึงบันทึกไม่ได้",
        );
      const draft = await tx.contentDraft.create({
        data: {
          userId,
          productId,
          ...options,
          ...text,
          aiProvider: generated.provider,
          aiModel: generated.model,
        },
      });
      await tx.aIUsage.create({
        data: {
          userId,
          type: "text",
          provider: generated.provider,
          model: generated.model,
          inputUsage: `${JSON.stringify(options).length} characters`,
          outputUsage: `${JSON.stringify(text).length} characters`,
        },
      });
      return draft;
    });
  } finally {
    activeUsers.delete(userId);
  }
}
