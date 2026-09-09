import "server-only";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import { decryptToken } from "@/lib/social/token-crypto";
import type { PublishFacebookInput } from "./validation";

const graphVersion = "v22.0";

type FacebookPublishResponse = { id?: string; error?: { message?: string } };

export function listPublishJobs(userId: string, contentId: string) {
  return getDb().publishJob.findMany({
    where: { userId, contentId },
    select: {
      id: true,
      platform: true,
      caption: true,
      status: true,
      externalPostId: true,
      errorMessage: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function publishToFacebook(
  userId: string,
  contentId: string,
  input: PublishFacebookInput,
) {
  const db = getDb();
  const [content, account] = await Promise.all([
    db.contentDraft.findFirst({
      where: { id: contentId, userId, product: { userId } },
      select: { id: true, status: true },
    }),
    db.socialAccount.findFirst({
      where: {
        id: input.socialAccountId,
        userId,
        platform: "facebook",
        status: "connected",
      },
      select: { id: true, externalAccountId: true, tokenCiphertext: true },
    }),
  ]);
  if (!content) throw new ProductError(404, "ไม่พบคอนเทนต์");
  if (content.status !== "ready")
    throw new ProductError(400, "ตั้งสถานะคอนเทนต์เป็น ready ก่อนเผยแพร่");
  if (!account)
    throw new ProductError(400, "กรุณาเชื่อมต่อ Facebook Page ก่อนเผยแพร่");

  const job = await db.publishJob.create({
    data: {
      userId,
      contentId,
      socialAccountId: account.id,
      platform: "facebook",
      caption: input.caption,
      status: "publishing",
    },
    select: { id: true },
  });

  try {
    const token = decryptToken(account.tokenCiphertext);
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${account.externalAccountId}/feed`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message: input.caption,
          access_token: token,
        }),
        cache: "no-store",
      },
    );
    const result = (await response
      .json()
      .catch(() => null)) as FacebookPublishResponse | null;
    if (!response.ok || !result?.id) {
      const message = result?.error?.message || "Facebook ไม่ตอบรับการเผยแพร่";
      throw new Error(message.slice(0, 500));
    }
    await db.publishJob.update({
      where: { id: job.id },
      data: {
        status: "published",
        externalPostId: result.id,
        publishedAt: new Date(),
      },
    });
    return { id: job.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "ไม่สามารถเผยแพร่ไป Facebook ได้";
    await db.publishJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: message },
    });
    throw new ProductError(502, `เผยแพร่ไม่สำเร็จ: ${message}`);
  }
}
