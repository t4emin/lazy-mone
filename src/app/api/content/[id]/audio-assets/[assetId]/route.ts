import { NextRequest, NextResponse } from "next/server";
import { productRequest } from "@/lib/products/http";
import { deleteContentAudio } from "@/lib/audio/service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; assetId: string }> },
) {
  return productRequest(request, async (userId) => {
    const { id, assetId } = await context.params;
    await deleteContentAudio(userId, id, assetId);
    return new NextResponse(null, { status: 204 });
  });
}
