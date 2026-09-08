import { NextRequest, NextResponse } from "next/server";
import { productRequest, readBody } from "@/lib/products/http";
import { uploadProductImages } from "@/lib/products/service";
import { ProductError } from "@/lib/products/errors";
import { MAX_IMAGE_BYTES, MAX_UPLOAD_FILES } from "@/lib/products/validation";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const body = await readBody(
      request,
      MAX_IMAGE_BYTES * MAX_UPLOAD_FILES + 128 * 1024,
    );
    let form: FormData;
    try {
      form = await new Response(new Uint8Array(body), {
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      }).formData();
    } catch {
      throw new ProductError(400, "ข้อมูลอัปโหลดไม่ถูกต้อง");
    }
    const files = form.getAll("images");
    if (files.some((file) => !(file instanceof File)))
      throw new ProductError(400, "กรุณาเลือกไฟล์รูปภาพ");
    await uploadProductImages(
      userId,
      (await context.params).id,
      files as File[],
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
