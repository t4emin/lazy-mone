import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { test } from "node:test";
import {
  generateToken,
  hashToken,
  verifyPassword,
} from "../src/lib/auth/crypto";

test("password verification accepts the correct password and rejects wrong or malformed values", async () => {
  const password = randomBytes(16).toString("hex");
  const salt = randomBytes(16).toString("hex");
  const stored = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  assert.equal(await verifyPassword(password, stored), true);
  assert.equal(await verifyPassword("wrong", stored), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
});

test("session tokens are unique and their persisted digest depends on the server secret", () => {
  const first = generateToken();
  const second = generateToken();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.notEqual(hashToken(first, "secret-one"), first);
  assert.notEqual(
    hashToken(first, "secret-one"),
    hashToken(first, "secret-two"),
  );
  assert.equal(hashToken(first, "secret-one"), hashToken(first, "secret-one"));
});
