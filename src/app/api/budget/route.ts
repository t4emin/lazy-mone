import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { updateBudget } from "@/lib/budget/service";
import { budgetSchema } from "@/lib/budget/validation";

export async function PATCH(request: NextRequest) {
  return productRequest(request, async (userId) => {
    await updateBudget(
      userId,
      budgetSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id: "budget" });
  });
}
