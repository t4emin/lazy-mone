import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { generationOptionsSchema } from "@/lib/content/validation";
import { generateDraft } from "@/lib/content/generation";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const options = generationOptionsSchema.parse(
      await readProductJson(request),
    );
    const content = await generateDraft(
      userId,
      (await context.params).id,
      options,
    );
    return NextResponse.json({ id: content.id }, { status: 201 });
  });
}
