import "server-only";
import { z } from "zod";
const schema = z.object({
  APP_ORIGIN: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value;
  }, "Use an HTTP(S) origin without a path or trailing slash"),
  DATABASE_URL: z.url().startsWith("postgresql://"),
  ADMIN_USERNAME: z.string().min(1).max(100),
  ADMIN_PASSWORD_HASH: z.string().regex(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/),
  SESSION_SECRET: z.string().min(32),
});
export function getEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid server configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  return result.data;
}
