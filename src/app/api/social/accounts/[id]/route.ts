import { NextRequest, NextResponse } from "next/server";
import { productRequest } from "@/lib/products/http";
import { removeSocialAccount } from "@/lib/social/service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const removed = await removeSocialAccount(
      userId,
      (await context.params).id,
    );
    if (!removed)
      return NextResponse.json(
        { error: "ไม่พบบัญชีที่เชื่อมต่อ" },
        { status: 404 },
      );
    return new NextResponse(null, { status: 204 });
  });
}
