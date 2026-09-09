import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { scheduleFacebookPublish } from "@/lib/publishing/service";
import { scheduleFacebookSchema } from "@/lib/publishing/validation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return productRequest(request, async (userId) => {
    const job = await scheduleFacebookPublish(
      userId,
      (await context.params).id,
      scheduleFacebookSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json(job, { status: 201 });
  });
}
