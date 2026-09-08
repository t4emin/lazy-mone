import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { generateToken, hashToken } from "./crypto";
export const SESSION_COOKIE = "affiliate_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await getDb().session.findUnique({
    where: { tokenHash: hashToken(token, getEnv().SESSION_SECRET) },
    include: { user: true },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.user.username !== getEnv().ADMIN_USERNAME
  )
    return null;
  return { user: { id: session.user.id, username: session.user.username } };
});
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
export async function createSession(username: string, oldToken?: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const db = getDb();
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          ...(oldToken
            ? [{ tokenHash: hashToken(oldToken, getEnv().SESSION_SECRET) }]
            : []),
        ],
      },
    });
    const user = await tx.user.upsert({
      where: { username },
      update: {},
      create: { username },
    });
    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token, getEnv().SESSION_SECRET),
        expiresAt,
      },
    });
  });
  return { token, expiresAt };
}
export async function destroySession(token?: string) {
  if (token)
    await getDb().session.deleteMany({
      where: { tokenHash: hashToken(token, getEnv().SESSION_SECRET) },
    });
}
