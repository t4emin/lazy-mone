import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { composeVideoSchema } from "@/lib/composer/validation";
import { composeVideo } from "@/lib/composer/service";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const asset = await composeVideo(
      userId,
      (await context.params).id,
      composeVideoSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id: asset.id }, { status: 201 });
  });
}
