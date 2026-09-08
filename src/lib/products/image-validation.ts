import sharp from "sharp";
import { MAX_IMAGE_BYTES } from "./validation";
import { ProductError } from "./errors";

export async function prepareImage(file: File) {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
    throw new ProductError(
      400,
      "รูปแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB และไม่ใช่ไฟล์ว่าง",
    );
  const extension = file.name.split(".").pop()?.toLowerCase();
  const formats = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    webp: "webp",
  } as const;
  if (!extension || !(extension in formats))
    throw new ProductError(400, "รองรับเฉพาะ JPG, JPEG, PNG และ WebP");
  const expected = formats[extension as keyof typeof formats];
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== expected ||
      (metadata.pages ?? 1) > 1 ||
      file.type !== `image/${expected}`
    )
      throw new Error("Unsupported image");
    // Decode and re-encode the actual image, stripping metadata and appended payloads.
    const data = await image.rotate().toFormat(expected).toBuffer();
    if (data.length > MAX_IMAGE_BYTES)
      throw new ProductError(400, "รูปหลังประมวลผลมีขนาดเกิน 5 MB");
    return {
      data,
      extension: (expected === "jpeg" ? "jpg" : expected) as
        "jpg" | "png" | "webp",
      mimeType: `image/${expected}`,
      fileName: file.name.split(/[\\/]/).pop()!.slice(0, 255),
      fileSize: data.length,
    };
  } catch (error) {
    if (error instanceof ProductError) throw error;
    throw new ProductError(
      400,
      "ไฟล์รูปไม่ถูกต้อง รูปต้องไม่เป็นภาพเคลื่อนไหว และมีขนาดไม่เกิน 20 ล้านพิกเซล",
    );
  }
}
