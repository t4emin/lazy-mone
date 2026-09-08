import { NextRequest, NextResponse } from "next/server";
import { productRequest } from "@/lib/products/http";
import { refreshVideoJob, retryVideoJob } from "@/lib/video/service";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) { return productRequest(request, async (userId) => { const job=await refreshVideoJob(userId,(await context.params).id); return NextResponse.json({id:job.id,status:job.status,progress:job.progress,outputAssetId:job.outputAssetId}); }); }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) { return productRequest(request, async (userId) => { const job=await retryVideoJob(userId,(await context.params).id); return NextResponse.json({id:job.id},{status:201}); }); }
