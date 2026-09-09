import { NextRequest, NextResponse } from "next/server";
import { runDueFacebookPublishes } from "@/lib/publishing/service";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await runDueFacebookPublishes());
}
