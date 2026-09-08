import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { editContentSchema } from "@/lib/content/validation";
import { deleteContent, updateContent } from "@/lib/content/service";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    const { id } = await context.params;
    await updateContent(
      userId,
      id,
      editContentSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id });
  });
}
export async function DELETE(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    await deleteContent(userId, (await context.params).id);
    return new NextResponse(null, { status: 204 });
  });
}
