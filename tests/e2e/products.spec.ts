import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { access } from "node:fs/promises";
import { Pool } from "pg";
import sharp from "sharp";
import { emptyProduct } from "../../src/lib/products/validation";

const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
let context: BrowserContext;
let pool: Pool;
const createdIds = new Set<string>();
const origin = { Origin: baseURL };
const authenticated = { ...origin, Cookie: "" };
async function fixture(name = "E2E product") {
  const response = await context.request.post("/api/products", {
    headers: authenticated,
    data: { ...emptyProduct, name: `${name} ${randomUUID()}` },
  });
  expect(response.status()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  createdIds.add(id);
  return id;
}
async function image(name: string, format: "png" | "jpeg" | "webp" = "png") {
  return {
    name,
    mimeType: `image/${format}`,
    buffer: await sharp({
      create: { width: 80, height: 60, channels: 3, background: "#598cb0" },
    })
      .toFormat(format)
      .toBuffer(),
  };
}
async function assetRows(id: string) {
  return (
    await pool.query<{ id: string; filePath: string; isPrimary: boolean }>(
      'SELECT "id", "filePath", "isPrimary" FROM "ProductAsset" WHERE "productId"=$1 ORDER BY "createdAt", "id"',
      [id],
    )
  ).rows;
}
async function upload(page: Page, files: Awaited<ReturnType<typeof image>>[]) {
  await page.getByLabel("เลือกไฟล์รูปภาพ").setInputFiles(files);
  await expect(page.getByRole("img", { name: /^Preview/ })).toHaveCount(
    files.length,
  );
  await page
    .getByRole("button", { name: "Upload Images", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("อัปโหลดรูปสำเร็จ");
}

test.beforeAll(async ({ browser }) => {
  if (!process.env.TEST_ADMIN_PASSWORD)
    throw new Error("Set TEST_ADMIN_PASSWORD");
  context = await browser.newContext({ baseURL });
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const response = await context.request.post("/api/auth/login", {
    headers: origin,
    form: {
      username: process.env.ADMIN_USERNAME!,
      password: process.env.TEST_ADMIN_PASSWORD,
    },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe(`${baseURL}/dashboard`);
  const cookie = (await context.cookies()).find(
    (item) => item.name === "affiliate_session",
  )!;
  // APIRequestContext does not apply Chrome's Secure-cookie exception for loopback HTTP.
  // Supply the actual authenticated cookie explicitly for API-only checks.
  authenticated.Cookie = `${cookie.name}=${cookie.value}`;
});
test.afterAll(async () => {
  for (const id of createdIds) {
    const response = await context.request.delete(`/api/products/${id}`, {
      headers: authenticated,
    });
    expect([204, 404]).toContain(response.status());
  }
  await context.request.post("/api/auth/logout", { headers: authenticated });
  await context.close();
  await pool.end();
});

test("create, edit, list, detail, refresh, images and product deletion work through UI", async () => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const name = `แก้วเก็บความเย็น E2E ${randomUUID().slice(0, 8)}`;
  await page.goto("/products");
  await page.getByRole("link", { name: "Add Product", exact: true }).click();
  await page.getByLabel("Product Name *", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Platform *", exact: true })
    .selectOption("TIKTOK_SHOP");
  await page
    .getByLabel("Product URL", { exact: true })
    .fill("https://example.com/product");
  await page
    .getByLabel("Affiliate URL", { exact: true })
    .fill("https://example.com/affiliate?ref=madao");
  await page.getByLabel("Price (THB)").fill("199.90");
  await page
    .getByLabel("Description", { exact: true })
    .fill("แก้วสำหรับใช้ทุกวัน");
  await page
    .getByLabel("Product Features", { exact: true })
    .fill("เก็บความเย็น\nล้างทำความสะอาดง่าย");
  await page.getByLabel("Notes", { exact: true }).fill("ทดสอบข้อมูลถาวร");
  await page.getByRole("button", { name: "Save Product" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  createdIds.add(id);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", {
      name: "https://example.com/affiliate?ref=madao",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Price (THB)")).toHaveValue("199.9");
  await page
    .getByLabel("Product Name *", { exact: true })
    .fill(`${name} edited`);
  await page.getByLabel("Price (THB)").fill("249.50");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("INACTIVE");
  await page.getByRole("button", { name: "Save Product" }).click();
  await expect(
    page.getByRole("heading", { name: `${name} edited`, exact: true }),
  ).toBeVisible();
  await upload(page, [
    await image("front.jpg", "jpeg"),
    await image("back.png"),
    await image("side.webp", "webp"),
  ]);
  await expect(page.locator(".image-card")).toHaveCount(3);
  const back = page.getByRole("article", { name: "back.png", exact: true });
  await back.getByRole("button", { name: "Set Main Image" }).click();
  await expect(back.getByText("Main Image", { exact: true })).toBeVisible();
  await page.reload();
  await expect(back.getByText("Main Image", { exact: true })).toBeVisible();
  const saved = await assetRows(id);
  const deletedPrimary = saved.find((asset) => asset.isPrimary)!;
  page.once("dialog", (dialog) => dialog.accept());
  await back.getByRole("button", { name: "Delete Image" }).click();
  await expect(page.locator(".image-card")).toHaveCount(2);
  await expect(page.getByText("Main Image", { exact: true })).toHaveCount(1);
  await expect(
    access(`.data/uploads/${deletedPrimary.filePath}`),
  ).rejects.toThrow();
  await page.screenshot({
    path: "test-results/product-detail.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "← Products", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: `${name} edited` });
  await expect(row).toContainText("Inactive");
  await expect(row).toContainText("249.50");
  await expect(
    row.getByRole("link", { name: "เปิดลิงก์ Affiliate ↗" }),
  ).toHaveAttribute("href", "https://example.com/affiliate?ref=madao");
  page.once("dialog", (dialog) => dialog.dismiss());
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).toHaveCount(0);
  expect(await assetRows(id)).toHaveLength(0);
  for (const asset of saved)
    await expect(access(`.data/uploads/${asset.filePath}`)).rejects.toThrow();
  expect(errors).toEqual([]);
  await page.close();
});

test("server rejects invalid fields, unsafe links and image files and rolls back failed batches", async () => {
  for (const data of [
    { ...emptyProduct, name: " " },
    { ...emptyProduct, name: "test", price: "-10" },
    { ...emptyProduct, name: "test", affiliateUrl: "javascript:alert(1)" },
  ]) {
    expect(
      (
        await context.request.post("/api/products", {
          headers: authenticated,
          data,
        })
      ).status(),
    ).toBe(400);
  }
  const id = await fixture();
  expect(
    (
      await context.request.post(`/api/products/${id}/images`, {
        headers: authenticated,
        multipart: {
          images: {
            name: "fake.png",
            mimeType: "image/png",
            buffer: Buffer.from("not an image"),
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await context.request.post(`/api/products/${id}/images`, {
        headers: authenticated,
        multipart: {
          images: {
            name: "huge.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
          },
        },
      })
    ).status(),
  ).toBe(400);
  const form = new FormData();
  const valid = await image("valid.png");
  form.append(
    "images",
    new File([new Uint8Array(valid.buffer)], valid.name, {
      type: valid.mimeType,
    }),
  );
  form.append("images", new File(["bad"], "bad.png", { type: "image/png" }));
  const response = await context.request.post(`/api/products/${id}/images`, {
    headers: authenticated,
    multipart: form,
  });
  expect(response.status()).toBe(400);
  expect(await assetRows(id)).toHaveLength(0);
});

test("image limits and concurrent primary changes preserve one primary image", async () => {
  const id = await fixture();
  const file = await image("limit.png");
  async function batch(count: number) {
    const form = new FormData();
    for (let i = 0; i < count; i++)
      form.append(
        "images",
        new File([new Uint8Array(file.buffer)], `${i}.png`, {
          type: file.mimeType,
        }),
      );
    return context.request.post(`/api/products/${id}/images`, {
      headers: authenticated,
      multipart: form,
    });
  }
  expect((await batch(6)).status()).toBe(400);
  expect((await batch(5)).status()).toBe(201);
  expect((await batch(5)).status()).toBe(201);
  expect((await batch(1)).status()).toBe(400);
  const assets = await assetRows(id);
  expect(assets).toHaveLength(10);
  const responses = await Promise.all(
    assets.slice(0, 3).map((asset) =>
      context.request.patch(`/api/products/${id}/images/${asset.id}`, {
        headers: authenticated,
      }),
    ),
  );
  expect(responses.map((response) => response.status())).toEqual([
    200, 200, 200,
  ]);
  expect((await assetRows(id)).filter((asset) => asset.isPrimary)).toHaveLength(
    1,
  );
});

test("anonymous users and another owner's product cannot be accessed or changed", async ({
  browser,
}) => {
  const id = await fixture();
  const assetUpload = await context.request.post(`/api/products/${id}/images`, {
    headers: authenticated,
    multipart: { images: await image("private.png") },
  });
  expect(assetUpload.status()).toBe(201);
  const [asset] = await assetRows(id);
  const anon = await browser.newContext({ baseURL });
  const page = await anon.newPage();
  for (const path of [
    "/products",
    "/products/new",
    `/products/${id}`,
    `/products/${id}/edit`,
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(`${baseURL}/login`);
  }
  expect((await anon.request.get(`/api/assets/${asset.id}`)).status()).toBe(
    401,
  );
  expect(
    (
      await anon.request.delete(`/api/products/${id}`, { headers: origin })
    ).status(),
  ).toBe(401);
  expect(
    (
      await anon.request.post("/api/products", {
        headers: origin,
        data: emptyProduct,
      })
    ).status(),
  ).toBe(401);
  await anon.close();
  expect(
    (
      await context.request.delete(`/api/products/${id}`, {
        headers: { ...authenticated, Origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  const otherUser = `e2e-${randomUUID()}`;
  const owner = (
    await pool.query<{ userId: string }>(
      'SELECT "userId" FROM "Product" WHERE "id"=$1',
      [id],
    )
  ).rows[0].userId;
  try {
    await pool.query(
      'INSERT INTO "User" ("id", "username", "updatedAt") VALUES ($1,$1,NOW())',
      [otherUser],
    );
    await pool.query('UPDATE "Product" SET "userId"=$1 WHERE "id"=$2', [
      otherUser,
      id,
    ]);
    expect(
      (
        await context.request.get(`/api/assets/${asset.id}`, {
          headers: authenticated,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await context.request.delete(`/api/products/${id}`, {
          headers: authenticated,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await context.request.patch(`/api/products/${id}`, {
          headers: authenticated,
          data: { ...emptyProduct, name: "stolen" },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await context.request.patch(`/api/products/${id}/images/${asset.id}`, {
          headers: authenticated,
        })
      ).status(),
    ).toBe(404);
    const ownPage = await context.newPage();
    await ownPage.goto(`/products/${id}`);
    await expect(
      ownPage.getByRole("heading", { name: "ไม่พบสินค้า" }),
    ).toBeVisible();
    await ownPage.close();
  } finally {
    await pool.query('UPDATE "Product" SET "userId"=$1 WHERE "id"=$2', [
      owner,
      id,
    ]);
    await pool.query('DELETE FROM "User" WHERE "id"=$1', [otherUser]);
  }
});
