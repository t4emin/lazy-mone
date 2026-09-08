import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth/login";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { isSameOrigin } from "@/lib/auth/request";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return new NextResponse("Forbidden", { status: 403 });
  if (Number(request.headers.get("content-length")) > 4096)
    return new NextResponse("Request too large", { status: 413 });
  try {
    const result = await verifyCredentials(await request.formData());
    if (result !== "valid")
      return NextResponse.redirect(
        new URL(`/login?error=${result}`, getEnv().APP_ORIGIN),
        303,
      );
    const { token, expiresAt } = await createSession(
      getEnv().ADMIN_USERNAME,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    const response = NextResponse.redirect(
      new URL("/dashboard", getEnv().APP_ORIGIN),
      303,
    );
    response.cookies.set(SESSION_COOKIE, token, {
      ...sessionCookieOptions,
      expires: expiresAt,
      maxAge: SESSION_DURATION_SECONDS,
    });
    return response;
  } catch {
    console.error(
      "Login failed: check server configuration and database availability.",
    );
    return NextResponse.redirect(
      new URL("/login?error=unavailable", getEnv().APP_ORIGIN),
      303,
    );
  }
}
