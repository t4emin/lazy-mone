import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { publishToFacebook } from "@/lib/publishing/service";
import { publishFacebookSchema } from "@/lib/publishing/validation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const job = await publishToFacebook(
      userId,
      (await context.params).id,
      publishFacebookSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json(job, { status: 201 });
  });
}
