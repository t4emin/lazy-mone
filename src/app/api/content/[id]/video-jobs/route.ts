import { NextRequest, NextResponse } from "next/server";
import { productRequest, readProductJson } from "@/lib/products/http";
import { createVideoJobSchema } from "@/lib/video/validation";
import { createVideoJob } from "@/lib/video/service";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) { return productRequest(request, async (userId) => { const job=await createVideoJob(userId,(await context.params).id,createVideoJobSchema.parse(await readProductJson(request))); return NextResponse.json({id:job.id},{status:201}); }); }
