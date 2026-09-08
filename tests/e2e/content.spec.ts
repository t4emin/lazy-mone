import { test, expect, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { emptyProduct } from "../../src/lib/products/validation";
import { defaultGenerationOptions } from "../../src/lib/content/validation";
test.skip(
  process.env.TEST_MOCK_AI !== "1",
  "Use test:e2e:ai for isolated mock AI tests.",
);
const baseURL = process.env.TEST_BASE_URL!;
let context: BrowserContext;
let pool: Pool;
let productId: string;
const headers = { Origin: baseURL, Cookie: "" };
const productName = `AI E2E ${randomUUID()}`;
test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ baseURL });
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const login = await context.request.post("/api/auth/login", {
    headers: { Origin: baseURL },
    form: {
      username: process.env.ADMIN_USERNAME!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    },
    maxRedirects: 0,
  });
  expect(login.headers().location).toBe(`${baseURL}/dashboard`);
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === "affiliate_session",
  )!;
  headers.Cookie = `${cookie.name}=${cookie.value}`;
  const response = await context.request.post("/api/products", {
    headers,
    data: {
      ...emptyProduct,
      name: productName,
      description: "Keeps drinks cool",
      features: "Steel body",
      price: "250.50",
      affiliateUrl: "https://example.com/affiliate?ref=test",
    },
  });
  expect(response.status()).toBe(201);
  productId = ((await response.json()) as { id: string }).id;
});
test.afterAll(async () => {
  if (productId) {
    const remaining = await pool.query<{ id: string }>(
      'SELECT "id" FROM "ContentDraft" WHERE "productId"=$1',
      [productId],
    );
    for (const row of remaining.rows)
      expect(
        (
          await context.request.delete(`/api/content/${row.id}`, { headers })
        ).status(),
      ).toBe(204);
    expect(
      (
        await context.request.delete(`/api/products/${productId}`, { headers })
      ).status(),
    ).toBe(204);
  }
  await context.request.post("/api/auth/logout", { headers });
  await context.close();
  await pool.end();
});
async function generate() {
  const response = await context.request.post(
    `/api/products/${productId}/content`,
    { headers, data: defaultGenerationOptions },
  );
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

test("generate from product data, edit five fields, save Ready, refresh and list with provenance", async () => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/products/${productId}`);
  await page.getByRole("link", { name: "Create Content", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Content Type", exact: true })
    .selectOption("short_review");
  await page
    .getByRole("combobox", { name: "Target Platform", exact: true })
    .selectOption("tiktok");
  await page
    .getByLabel("Target Audience", { exact: true })
    .fill("Office workers");
  await page
    .getByRole("button", { name: "Generate Content", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Content Editor" }),
  ).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").pop()!;
  await expect(
    page.getByRole("textbox", { name: "Hook", exact: true }),
  ).toHaveValue(`MOCK: ${productName}`);
  await expect(
    page.getByRole("textbox", { name: "Video Script", exact: true }),
  ).toHaveValue(
    /Keeps drinks cool; Steel body; short_review; th; friendly; Office workers/,
  );
  await expect(
    page.getByRole("textbox", { name: "Caption", exact: true }),
  ).toHaveValue(
    /250.5 THB; SHOPEE; https:\/\/example.com\/affiliate\?ref=test; tiktok/,
  );
  await expect(
    page.getByRole("textbox", { name: "CTA", exact: true }),
  ).not.toHaveValue("");
  await expect(page.getByRole("textbox", { name: /^Hashtags/ })).toHaveValue(
    "#MockTest #Affiliate",
  );
  for (const [label, value] of [
    ["Hook", "Edited hook"],
    ["Video Script", "Edited script"],
    ["Caption", "Edited caption"],
    ["CTA", "Edited CTA"],
    ["Hashtags", "#Edited #Content"],
  ])
    await page
      .getByRole("textbox", { name: label, exact: label != "Hashtags" })
      .fill(value);
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("ready");
  await page.getByRole("button", { name: "Save Draft / Status" }).click();
  await expect(page.getByRole("status")).toHaveText("บันทึกคอนเทนต์แล้ว");
  await page.reload();
  for (const [label, value] of [
    ["Hook", "Edited hook"],
    ["Video Script", "Edited script"],
    ["Caption", "Edited caption"],
    ["CTA", "Edited CTA"],
  ])
    await expect(
      page.getByRole("textbox", { name: label, exact: true }),
    ).toHaveValue(value);
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("ready");
  const stored = (
    await pool.query('SELECT * FROM "ContentDraft" WHERE "id"=$1', [id])
  ).rows[0];
  expect(stored.aiProvider).toBe("openai");
  expect(stored.aiModel).toBe("mock-openai-model");
  expect(stored.version).toBe(2);
  expect(stored.hashtags).toEqual(["#Edited", "#Content"]);
  await page.screenshot({
    path: "test-results/content-editor.png",
    fullPage: true,
  });
  await page.goto("/content");
  await expect(
    page.getByRole("row").filter({ hasText: productName }),
  ).toContainText("Ready");
  expect(errors).toEqual([]);
  await page.close();
});

test("AI failures create no draft; forged metadata and stale saves are rejected", async () => {
  const count = async () =>
    (
      await pool.query(
        'SELECT COUNT(*)::int AS count FROM "ContentDraft" WHERE "productId"=$1',
        [productId],
      )
    ).rows[0].count;
  const before = await count();
  for (const [instructions, status] of [
    ["__mock_failure__", 429],
    ["__mock_invalid__", 502],
  ] as const)
    expect(
      (
        await context.request.post(`/api/products/${productId}/content`, {
          headers,
          data: {
            ...defaultGenerationOptions,
            additionalInstructions: instructions,
          },
        })
      ).status(),
    ).toBe(status);
  expect(await count()).toBe(before);
  expect(
    (
      await context.request.post(`/api/products/${productId}/content`, {
        headers,
        data: { ...defaultGenerationOptions, contentType: "invalid" },
      })
    ).status(),
  ).toBe(400);
  const id = await generate();
  const data = {
    hook: "A",
    script: "B",
    caption: "C",
    cta: "D",
    hashtags: ["#Tag"],
    status: "draft",
    version: 1,
  };
  expect(
    (
      await context.request.patch(`/api/content/${id}`, {
        headers,
        data: { ...data, aiProvider: "forged" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await context.request.patch(`/api/content/${id}`, { headers, data })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.patch(`/api/content/${id}`, { headers, data })
    ).status(),
  ).toBe(409);
  expect(
    (
      await context.request.delete(`/api/products/${productId}`, { headers })
    ).status(),
  ).toBe(409);
});

test("generated images are stored as content assets with prompt, ratio and provenance", async () => {
  const id = await generate();
  const response = await context.request.post(`/api/content/${id}/assets`, {
    headers,
    data: {
      prompt: "Studio product photograph with a clean background",
      aspectRatio: "9:16",
      referenceAssetIds: [],
    },
  });
  expect(response.status()).toBe(201);
  const { id: assetId } = (await response.json()) as { id: string };
  const stored = (
    await pool.query('SELECT * FROM "ProductAsset" WHERE "id"=$1', [assetId])
  ).rows[0];
  expect(stored.type).toBe("generated_image");
  expect(stored.contentId).toBe(id);
  expect(stored.aspectRatio).toBe("9:16");
  expect(stored.aiProvider).toBe("openai");
  expect(stored.aiModel).toBe("gpt-image-2");
  expect(stored.prompt).toContain("Studio product");
  expect(
    (await context.request.get(`/api/assets/${assetId}`, { headers })).status(),
  ).toBe(200);
  expect(
    (
      await context.request.delete(`/api/content/${id}/assets/${assetId}`, {
        headers,
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await context.request.delete(`/api/content/${id}/assets/${assetId}`, {
        headers,
      })
    ).status(),
  ).toBe(404);
});

test("anonymous and other owners cannot generate, read or delete drafts", async ({
  browser,
}) => {
  const id = await generate();
  const anonymous = await browser.newContext({ baseURL });
  const page = await anonymous.newPage();
  for (const path of [
    `/products/${productId}/content/new`,
    `/content/${id}`,
    "/content",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(`${baseURL}/login`);
  }
  expect(
    (
      await anonymous.request.post(`/api/products/${productId}/content`, {
        headers: { Origin: baseURL },
        data: defaultGenerationOptions,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await anonymous.request.delete(`/api/content/${id}`, {
        headers: { Origin: baseURL },
      })
    ).status(),
  ).toBe(401);
  await anonymous.close();
  expect(
    (
      await context.request.post(`/api/products/${productId}/content`, {
        headers: { ...headers, Origin: "https://evil.example" },
        data: defaultGenerationOptions,
      })
    ).status(),
  ).toBe(403);
  const otherUser = `content-test-${randomUUID()}`;
  const owner = (
    await pool.query('SELECT "userId" FROM "Product" WHERE "id"=$1', [
      productId,
    ])
  ).rows[0].userId as string;
  try {
    await pool.query(
      'INSERT INTO "User" ("id","username","updatedAt") VALUES ($1,$1,NOW())',
      [otherUser],
    );
    await pool.query('UPDATE "Product" SET "userId"=$1 WHERE "id"=$2', [
      otherUser,
      productId,
    ]);
    expect(
      (
        await context.request.post(`/api/products/${productId}/content`, {
          headers,
          data: defaultGenerationOptions,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await context.request.delete(`/api/content/${id}`, { headers })
      ).status(),
    ).toBe(404);
    const ownPage = await context.newPage();
    const response = await ownPage.goto(`/content/${id}`);
    expect(response?.status()).toBe(404);
    await ownPage.close();
  } finally {
    await pool.query('UPDATE "Product" SET "userId"=$1 WHERE "id"=$2', [
      owner,
      productId,
    ]);
    await pool.query('DELETE FROM "User" WHERE "id"=$1', [otherUser]);
  }
});
