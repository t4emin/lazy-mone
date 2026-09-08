import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { generateAudioSchema } from "@/lib/audio/validation";
import { generateContentAudio } from "@/lib/audio/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const asset = await generateContentAudio(
      userId,
      (await context.params).id,
      generateAudioSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id: asset.id }, { status: 201 });
  });
}
