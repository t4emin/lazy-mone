import { z } from "zod";

export const platformLabels = {
  SHOPEE: "Shopee",
  TIKTOK_SHOP: "TikTok Shop",
  OTHER: "Other",
} as const;
export const statusLabels = { ACTIVE: "Active", INACTIVE: "Inactive" } as const;
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "กรุณากรอก URL ที่ขึ้นต้นด้วย https:// หรือ http://")
  .transform((value) => value || null);

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(200, "ชื่อสินค้าต้องไม่เกิน 200 ตัวอักษร"),
  platform: z.enum(["SHOPEE", "TIKTOK_SHOP", "OTHER"]),
  productUrl: optionalUrl,
  affiliateUrl: optionalUrl,
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{1,10}(\.\d{1,2})?$/.test(value),
      "ราคาต้องเป็นเลขไม่ติดลบ ไม่เกิน 9,999,999,999.99 และมีทศนิยมไม่เกิน 2 ตำแหน่ง",
    )
    .transform((value) => value || null),
  description: optionalText(10000),
  features: optionalText(10000),
  notes: optionalText(10000),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type ProductInput = z.output<typeof productSchema>;
export type ProductFormValues = z.input<typeof productSchema>;
export const emptyProduct: ProductFormValues = {
  name: "",
  platform: "SHOPEE",
  productUrl: "",
  affiliateUrl: "",
  price: "",
  description: "",
  features: "",
  notes: "",
  status: "ACTIVE",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 5;
export const MAX_PRODUCT_IMAGES = 10;
