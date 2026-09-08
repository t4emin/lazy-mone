import { NextRequest, NextResponse } from "next/server";
import { productRequest } from "@/lib/products/http";
import { changeProductImage } from "@/lib/products/service";
type Context = { params: Promise<{ id: string; assetId: string }> };
async function change(
  request: NextRequest,
  context: Context,
  operation: "primary" | "delete",
) {
  return productRequest(request, async (userId) => {
    const { id, assetId } = await context.params;
    await changeProductImage(userId, id, assetId, operation);
    return NextResponse.json({ ok: true });
  });
}
export async function PATCH(request: NextRequest, context: Context) {
  return change(request, context, "primary");
}
export async function DELETE(request: NextRequest, context: Context) {
  return change(request, context, "delete");
}
