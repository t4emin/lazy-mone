import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { productSchema } from "@/lib/products/validation";
import { deleteProduct, updateProduct } from "@/lib/products/service";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    const { id } = await context.params;
    await updateProduct(
      userId,
      id,
      productSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id });
  });
}
export async function DELETE(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    await deleteProduct(userId, (await context.params).id);
    return new NextResponse(null, { status: 204 });
  });
}
