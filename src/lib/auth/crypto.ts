import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scryptAsync = promisify(scrypt);
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(storedHash)) return false;
  const [, salt, digest] = storedHash.split(":");
  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(digest, "hex"));
}
export function generateToken() {
  return randomBytes(32).toString("hex");
}
export function hashToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}
