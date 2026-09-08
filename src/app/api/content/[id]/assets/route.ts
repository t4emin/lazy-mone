import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { imageGenerationSchema } from "@/lib/assets/validation";
import { generateContentImage } from "@/lib/assets/service";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const asset = await generateContentImage(
      userId,
      (await context.params).id,
      imageGenerationSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id: asset.id }, { status: 201 });
  });
}
