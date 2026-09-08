import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import {
  emptyProduct,
  productSchema,
  MAX_IMAGE_BYTES,
} from "../src/lib/products/validation";
import { prepareImage } from "../src/lib/products/image-validation";

test("product validation preserves decimals, allows missing price and rejects unsafe links", () => {
  const valid = { ...emptyProduct, name: "  สินค้าทดสอบ  ", price: "199.90" };
  assert.equal(productSchema.parse(valid).price, "199.90");
  assert.equal(productSchema.parse(valid).name, "สินค้าทดสอบ");
  assert.equal(productSchema.parse({ ...valid, price: "" }).price, null);
  assert.equal(productSchema.parse({ ...valid, price: "0" }).price, "0");
  for (const update of [
    { price: "-1" },
    { price: "1.001" },
    { price: "10000000000" },
    { affiliateUrl: "javascript:alert(1)" },
    { productUrl: "file:///etc/passwd" },
    { name: "   " },
    { platform: "UNKNOWN" },
    { status: "UNKNOWN" },
  ]) {
    assert.equal(
      productSchema.safeParse({ ...valid, ...update }).success,
      false,
    );
  }
});

test("image validation decodes supported formats and rejects corrupt, spoofed or oversized files", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const bytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#6699cc" },
    })
      .toFormat(format)
      .toBuffer();
    const file = new File([new Uint8Array(bytes)], `image.${format}`, {
      type: `image/${format}`,
    });
    const result = await prepareImage(file);
    assert.equal(result.mimeType, `image/${format}`);
    assert.equal((await sharp(result.data).metadata()).format, format);
  }
  const invalid = [
    new File(["fake"], "image.png", { type: "image/png" }),
    new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png", {
      type: "image/png",
    }),
  ];
  for (const file of invalid) await assert.rejects(() => prepareImage(file));
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(() =>
    prepareImage(
      new File([new Uint8Array(png)], "pretend.jpg", { type: "image/jpeg" }),
    ),
  );
});
