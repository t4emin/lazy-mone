import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { productSchema } from "@/lib/products/validation";
import { createProduct } from "@/lib/products/service";
export async function POST(request: NextRequest) {
  return productRequest(request, async (userId) => {
    const product = await createProduct(
      userId,
      productSchema.parse(await readProductJson(request)),
    );
    return NextResponse.json({ id: product.id }, { status: 201 });
  });
}
