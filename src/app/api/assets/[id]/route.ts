import { NextRequest } from "next/server";
import { productRequest } from "@/lib/products/http";
import { readProductImage } from "@/lib/products/service";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const image = await readProductImage(userId, (await context.params).id);
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(image.data.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  });
}
