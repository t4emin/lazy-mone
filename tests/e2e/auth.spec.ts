import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { Pool } from "pg";

const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const password = process.env.TEST_ADMIN_PASSWORD;
if (!password)
  throw new Error("Set TEST_ADMIN_PASSWORD to the configured admin password.");
const username = process.env.ADMIN_USERNAME ?? "madao";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/dashboard`);
}

test("anonymous root and every protected route redirect to login", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/dashboard",
    "/products",
    "/content",
    "/settings",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(`${baseURL}/login`);
    await expect(
      page.getByRole("heading", { name: "Login", exact: true }),
    ).toBeVisible();
  }
});

test("wrong password and wrong username are rejected with the same error", async ({
  page,
}) => {
  for (const [user, pass] of [
    [username, "incorrect-password"],
    ["incorrect-user", password!],
  ]) {
    await page.goto("/login");
    await page.getByLabel("Username").fill(user);
    await page.getByLabel("Password", { exact: true }).fill(pass);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }),
    ).toBeVisible();
    expect(
      (await page.context().cookies()).find(
        (cookie) => cookie.name === "affiliate_session",
      ),
    ).toBeUndefined();
  }
});

test("login, refresh, navigation, HttpOnly session, logout and replay protection", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await login(page);
  await expect(page.getByText(`Welcome, ${username}`)).toBeVisible();
  await expect(page.locator(".stat p").first()).toHaveText(/^\d+$/);
  await expect(page.locator(".stat p").nth(1)).toHaveText(/^\d+$/);
  await expect(page.locator(".stat p").nth(2)).toHaveText("0");
  await expect(page.locator(".stat p").nth(3)).toHaveText("0");
  const session = (await context.cookies()).find(
    (cookie) => cookie.name === "affiliate_session",
  )!;
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Lax");
  expect(session.expires).toBeGreaterThan(Date.now() / 1000);
  if (process.env.TEST_PRODUCTION === "1") expect(session.secure).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "affiliate_session",
  );
  await page.reload();
  await expect(page.getByText(`Welcome, ${username}`)).toBeVisible();
  for (const path of ["/", "/login"]) {
    await page.goto(path);
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
  }
  for (const name of ["Products", "Content", "Settings", "Dashboard"]) {
    await page
      .getByRole("navigation")
      .getByRole("link", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: `test-results/dashboard-${process.env.TEST_PRODUCTION === "1" ? "production" : "dev"}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(`${baseURL}/login`);
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === "affiliate_session",
    ),
  ).toBeUndefined();
  await context.addCookies([session]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(`${baseURL}/login`);
  expect(errors).toEqual([]);
});

test("expired and forged sessions are rejected, and stored token is a digest", async ({
  page,
  context,
}) => {
  await login(page);
  const cookie = (await context.cookies()).find(
    (item) => item.name === "affiliate_session",
  )!;
  const hash = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(cookie.value)
    .digest("hex");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query(
      'SELECT "tokenHash" FROM "Session" WHERE "tokenHash" = $1',
      [hash],
    );
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].tokenHash).not.toBe(cookie.value);
    await pool.query(
      'UPDATE "Session" SET "expiresAt" = NOW() - INTERVAL \'1 second\' WHERE "tokenHash" = $1',
      [hash],
    );
    await page.goto("/dashboard");
    await expect(page).toHaveURL(`${baseURL}/login`);
    await context.addCookies([{ ...cookie, value: "a".repeat(64) }]);
    await page.goto("/settings");
    await expect(page).toHaveURL(`${baseURL}/login`);
  } finally {
    await pool.query('DELETE FROM "Session" WHERE "tokenHash" = $1', [hash]);
    await pool.end();
  }
});

test("auth endpoints reject cross-origin and GET mutations; server validates fields", async ({
  request,
}) => {
  for (const endpoint of ["login", "logout"]) {
    const response = await request.post(`/api/auth/${endpoint}`, {
      headers: { Origin: "https://untrusted.example" },
      form: { username, password: password! },
    });
    expect(response.status()).toBe(403);
    expect((await request.get(`/api/auth/${endpoint}`)).status()).toBe(405);
  }
  for (const form of [
    { username: "", password: "" },
    { username, password: "x".repeat(257) },
  ]) {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: baseURL },
      form,
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe(`${baseURL}/login?error=invalid`);
  }
});
