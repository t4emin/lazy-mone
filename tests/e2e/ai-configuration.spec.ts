import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { emptyProduct } from "../../src/lib/products/validation";
import { defaultGenerationOptions } from "../../src/lib/content/validation";
test("unconfigured AI is clearly disabled and the server refuses generation", async ({
  page,
  context,
}) => {
  test.skip(
    Boolean(process.env.OPENAI_API_KEY?.trim()) ||
      process.env.TEST_MOCK_AI === "1",
    "Only for a server without an AI key",
  );
  const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
  await context.request.post("/api/auth/login", {
    headers: { Origin: baseURL },
    form: {
      username: process.env.ADMIN_USERNAME!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    },
    maxRedirects: 0,
  });
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === "affiliate_session",
  )!;
  const headers = { Origin: baseURL, Cookie: `${cookie.name}=${cookie.value}` };
  const response = await context.request.post("/api/products", {
    headers,
    data: { ...emptyProduct, name: `AI config test ${randomUUID()}` },
  });
  expect(response.status()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  try {
    await page.goto(`/products/${id}/content/new`);
    await expect(
      page.getByRole("button", { name: "Generate Content", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("alert").filter({ hasText: "OPENAI_API_KEY" }),
    ).toBeVisible();
    const generate = await context.request.post(`/api/products/${id}/content`, {
      headers,
      data: defaultGenerationOptions,
    });
    expect(generate.status()).toBe(503);
    expect((await generate.json()).error).toContain("OPENAI_API_KEY");
  } finally {
    expect(
      (
        await context.request.delete(`/api/products/${id}`, { headers })
      ).status(),
    ).toBe(204);
    await context.request.post("/api/auth/logout", { headers });
  }
});
