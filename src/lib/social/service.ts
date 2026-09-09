import "server-only";
import { getDb } from "@/lib/db";
import { encryptToken } from "./token-crypto";
export function listSocialAccounts(userId: string) {
  return getDb().socialAccount.findMany({
    where: { userId },
    select: {
      id: true,
      platform: true,
      accountName: true,
      externalAccountId: true,
      expiresAt: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
export function saveFacebookPage(
  userId: string,
  page: { id: string; name: string; access_token: string },
) {
  return getDb().socialAccount.upsert({
    where: {
      userId_platform_externalAccountId: {
        userId,
        platform: "facebook",
        externalAccountId: page.id,
      },
    },
    update: {
      accountName: page.name,
      tokenCiphertext: encryptToken(page.access_token),
      status: "connected",
    },
    create: {
      userId,
      platform: "facebook",
      accountName: page.name,
      externalAccountId: page.id,
      tokenCiphertext: encryptToken(page.access_token),
    },
  });
}
