import { test, expect } from "@playwright/test";
const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
test("repeated login attempts are throttled", async ({ request }) => {
  let limited = false;
  for (let attempt = 0; attempt < 11; attempt++) {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: baseURL },
      form: { username: "bad", password: "bad" },
      maxRedirects: 0,
    });
    if (response.headers().location?.endsWith("error=limited")) {
      limited = true;
      break;
    }
  }
  expect(limited).toBe(true);
});
