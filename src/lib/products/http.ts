import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/auth/request";
import { ProductError } from "./errors";

export async function productRequest(
  request: NextRequest,
  handler: (userId: string) => Promise<Response>,
) {
  try {
    const session = await getSession();
    if (!session) throw new ProductError(401, "กรุณาเข้าสู่ระบบอีกครั้ง");
    if (request.method !== "GET" && !isSameOrigin(request))
      throw new ProductError(403, "ไม่อนุญาตคำขอจากเว็บไซต์อื่น");
    return await handler(session.user.id);
  } catch (error) {
    if (error instanceof ProductError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    console.error(
      "Product operation failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง" },
      { status: 500 },
    );
  }
}

// Bound the actual stream as well as Content-Length (which clients can omit).
export async function readBody(
  request: NextRequest,
  limit: number,
): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new ProductError(413, "ข้อมูลที่ส่งมีขนาดใหญ่เกินกำหนด");
  const reader = request.body?.getReader();
  if (!reader) throw new ProductError(400, "ไม่พบข้อมูล");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ProductError(413, "ข้อมูลที่ส่งมีขนาดใหญ่เกินกำหนด");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readProductJson(request: NextRequest): Promise<unknown> {
  const body = await readBody(request, 150_000);
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new ProductError(400, "ข้อมูล JSON ไม่ถูกต้อง");
  }
}
