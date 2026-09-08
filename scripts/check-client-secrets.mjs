import "dotenv/config";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const values = [
  "ADMIN_PASSWORD_HASH",
  "SESSION_SECRET",
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
].map((key) => {
  assert.ok(process.env[key], `${key} must be configured`);
  return process.env[key];
});
if (process.env.TEST_ADMIN_PASSWORD)
  values.push(process.env.TEST_ADMIN_PASSWORD);
if (process.env.OPENAI_API_KEY) values.push(process.env.OPENAI_API_KEY);
if (process.env.RUNWAYML_API_SECRET)
  values.push(process.env.RUNWAYML_API_SECRET);
let checked = 0;
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspect(path);
    else {
      const content = readFileSync(path, "utf8");
      assert.ok(
        !values.some((value) => content.includes(value)),
        `Secret found in client asset: ${path}`,
      );
      checked++;
    }
  }
}
inspect(".next/static");
assert.ok(checked > 0, "Run npm run build first");
console.log(`Passed: no configured secrets found in ${checked} client assets.`);
