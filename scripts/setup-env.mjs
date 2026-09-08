import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const input = createInterface({ input: process.stdin, output: process.stdout });
try {
  const password = await input.question(
    "Initial admin password (input is visible; minimum 8 characters): ",
  );
  if (password.length < 8) throw new Error("Use at least 8 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const dbPassword = randomBytes(24).toString("hex");
  writeFileSync(
    ".env",
    [
      `DATABASE_URL=postgresql://affiliate:${dbPassword}@127.0.0.1:55432/affiliate?schema=public`,
      "APP_ORIGIN=http://127.0.0.1:3000",
      "ADMIN_USERNAME=madao",
      `ADMIN_PASSWORD_HASH=scrypt:${salt}:${hash}`,
      `SESSION_SECRET=${randomBytes(32).toString("hex")}`,
      "POSTGRES_USER=affiliate",
      `POSTGRES_PASSWORD=${dbPassword}`,
      "POSTGRES_DB=affiliate",
      "AI_TEXT_PROVIDER=openai",
      "OPENAI_TEXT_MODEL=gpt-5.4-mini",
      "OPENAI_API_KEY=",
      "AI_IMAGE_PROVIDER=openai",
      "OPENAI_IMAGE_MODEL=gpt-image-2",
      "AI_VIDEO_PROVIDER=runway",
      "RUNWAY_VIDEO_MODEL=gen4.5",
      "RUNWAYML_API_SECRET=",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created .env with a password hash and random secrets.");
} finally {
  input.close();
}
