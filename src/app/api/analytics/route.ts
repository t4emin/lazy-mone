import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { saveAnalytics } from "@/lib/analytics/service";
import { analyticsSchema } from "@/lib/analytics/validation";
export async function POST(request: NextRequest) {
  return productRequest(request, async (userId) =>
    NextResponse.json(
      {
        id: (
          await saveAnalytics(
            userId,
            analyticsSchema.parse(await readProductJson(request)),
          )
        ).id,
      },
      { status: 201 },
    ),
  );
}
