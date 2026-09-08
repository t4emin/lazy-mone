import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const key = () => {
  const value = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
  if (!value) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is not configured");
  const bytes = Buffer.from(value, "base64");
  if (bytes.length !== 32) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY must be a 32-byte base64 value");
  return bytes;
};
export function encryptToken(token: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function decryptToken(ciphertext: string) {
  const data = Buffer.from(ciphertext, "base64"); const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28)); return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
}
