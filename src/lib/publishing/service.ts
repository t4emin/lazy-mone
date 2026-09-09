import "server-only";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import { decryptToken } from "@/lib/social/token-crypto";
import type { PublishFacebookInput, ScheduleFacebookInput } from "./validation";

const graphVersion = "v22.0";
type FacebookPublishResponse = { id?: string; error?: { message?: string } };
type FacebookAccount = { externalAccountId: string; tokenCiphertext: string };

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
      scheduledAt: true,
      cancelledAt: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getPublishContext(
  userId: string,
  contentId: string,
  socialAccountId: string,
) {
  const db = getDb();
  const [content, account] = await Promise.all([
    db.contentDraft.findFirst({
      where: { id: contentId, userId, product: { userId } },
      select: { id: true, status: true },
    }),
    db.socialAccount.findFirst({
      where: {
        id: socialAccountId,
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
  return { account };
}

async function deliverFacebookJob(jobId: string, account: FacebookAccount) {
  const db = getDb();
  const job = await db.publishJob.findUnique({
    where: { id: jobId },
    select: { caption: true },
  });
  if (!job) return { ok: false as const, message: "ไม่พบรายการเผยแพร่" };
  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${account.externalAccountId}/feed`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message: job.caption,
          access_token: decryptToken(account.tokenCiphertext),
        }),
        cache: "no-store",
      },
    );
    const result = (await response
      .json()
      .catch(() => null)) as FacebookPublishResponse | null;
    if (!response.ok || !result?.id)
      throw new Error(
        (result?.error?.message || "Facebook ไม่ตอบรับการเผยแพร่").slice(
          0,
          500,
        ),
      );
    await db.publishJob.update({
      where: { id: jobId },
      data: {
        status: "published",
        externalPostId: result.id,
        publishedAt: new Date(),
      },
    });
    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "ไม่สามารถเผยแพร่ไป Facebook ได้";
    await db.publishJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: message },
    });
    return { ok: false as const, message };
  }
}

export async function publishToFacebook(
  userId: string,
  contentId: string,
  input: PublishFacebookInput,
) {
  const { account } = await getPublishContext(
    userId,
    contentId,
    input.socialAccountId,
  );
  const job = await getDb().publishJob.create({
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
  const result = await deliverFacebookJob(job.id, account);
  if (!result.ok)
    throw new ProductError(502, `เผยแพร่ไม่สำเร็จ: ${result.message}`);
  return job;
}

export async function scheduleFacebookPublish(
  userId: string,
  contentId: string,
  input: ScheduleFacebookInput,
) {
  const scheduledAt = new Date(input.scheduledAt);
  if (scheduledAt <= new Date())
    throw new ProductError(400, "เวลาเผยแพร่ต้องอยู่ในอนาคต");
  const { account } = await getPublishContext(
    userId,
    contentId,
    input.socialAccountId,
  );
  return getDb().publishJob.create({
    data: {
      userId,
      contentId,
      socialAccountId: account.id,
      platform: "facebook",
      caption: input.caption,
      status: "scheduled",
      scheduledAt,
    },
    select: { id: true },
  });
}

export async function rescheduleFacebookPublish(
  userId: string,
  contentId: string,
  jobId: string,
  scheduledAtValue: string,
) {
  const scheduledAt = new Date(scheduledAtValue);
  if (scheduledAt <= new Date())
    throw new ProductError(400, "เวลาเผยแพร่ต้องอยู่ในอนาคต");
  const result = await getDb().publishJob.updateMany({
    where: {
      id: jobId,
      userId,
      contentId,
      platform: "facebook",
      status: "scheduled",
    },
    data: { scheduledAt },
  });
  if (!result.count) throw new ProductError(404, "ไม่พบรายการที่ตั้งเวลาไว้");
}

export async function cancelFacebookSchedule(
  userId: string,
  contentId: string,
  jobId: string,
) {
  const result = await getDb().publishJob.updateMany({
    where: {
      id: jobId,
      userId,
      contentId,
      platform: "facebook",
      status: "scheduled",
    },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  if (!result.count) throw new ProductError(404, "ไม่พบรายการที่ตั้งเวลาไว้");
}

export async function runDueFacebookPublishes() {
  const db = getDb();
  const candidates = await db.publishJob.findMany({
    where: {
      platform: "facebook",
      status: "scheduled",
      scheduledAt: { lte: new Date() },
    },
    select: { id: true },
    take: 25,
  });
  let published = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const claimed = await db.publishJob.updateMany({
      where: {
        id: candidate.id,
        status: "scheduled",
        scheduledAt: { lte: new Date() },
      },
      data: { status: "publishing" },
    });
    if (!claimed.count) continue;
    const job = await db.publishJob.findUnique({
      where: { id: candidate.id },
      select: { socialAccountId: true },
    });
    const account = job
      ? await db.socialAccount.findUnique({
          where: { id: job.socialAccountId },
          select: { externalAccountId: true, tokenCiphertext: true },
        })
      : null;
    if (!account) {
      await db.publishJob.update({
        where: { id: candidate.id },
        data: {
          status: "failed",
          errorMessage: "ไม่พบบัญชี Facebook ที่เชื่อมต่อ",
        },
      });
      failed += 1;
      continue;
    }
    const result = await deliverFacebookJob(candidate.id, account);
    if (result.ok) published += 1;
    else failed += 1;
  }
  return { processed: candidates.length, published, failed };
}
