import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import {
  cancelFacebookSchedule,
  rescheduleFacebookPublish,
} from "@/lib/publishing/service";
import { rescheduleFacebookSchema } from "@/lib/publishing/validation";

type Context = { params: Promise<{ id: string; jobId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    const { id, jobId } = await context.params;
    const { scheduledAt } = rescheduleFacebookSchema.parse(
      await readProductJson(request),
    );
    await rescheduleFacebookPublish(userId, id, jobId, scheduledAt);
    return NextResponse.json({ id: jobId });
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return productRequest(request, async (userId) => {
    const { id, jobId } = await context.params;
    await cancelFacebookSchedule(userId, id, jobId);
    return new NextResponse(null, { status: 204 });
  });
}
