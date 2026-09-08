import "server-only";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { verifyPassword } from "./crypto";
const credentialsSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(256),
});
// A single-process MVP limit; replace with a shared limiter before running replicas.
const attempts: number[] = [];
export async function verifyCredentials(
  form: FormData,
): Promise<"valid" | "invalid" | "limited"> {
  const now = Date.now();
  while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
  if (attempts.length >= 10) return "limited";
  attempts.push(now);
  const parsed = credentialsSchema.safeParse({
    username: form.get("username"),
    password: form.get("password"),
  });
  if (!parsed.success) return "invalid";
  const env = getEnv();
  const passwordValid = await verifyPassword(
    parsed.data.password,
    env.ADMIN_PASSWORD_HASH,
  );
  return passwordValid && parsed.data.username === env.ADMIN_USERNAME
    ? "valid"
    : "invalid";
}
