import "dotenv/config";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
if (!process.env.TEST_ADMIN_PASSWORD)
  throw new Error("Set TEST_ADMIN_PASSWORD before browser tests.");
const port = 3100;
const origin = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  APP_ORIGIN: origin,
  OPENAI_API_KEY: "e2e-placeholder-not-a-real-key",
  AI_TEXT_PROVIDER: "openai",
  TEST_MOCK_AI: "1",
  TEST_BASE_URL: origin,
  TEST_PRODUCTION: "1",
};
const server = spawn(
  process.execPath,
  [
    "--import",
    resolve("tests/helpers/mock-openai.mjs"),
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { env, stdio: "inherit" },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error("Test server could not start");
    try {
      ready = (await fetch(`${origin}/login`)).ok;
    } catch {
      /* Startup in progress. */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Test server did not become ready");
  const tests = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    { env, stdio: "inherit" },
  );
  const [code] = await once(tests, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}
