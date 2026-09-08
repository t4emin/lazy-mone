import { NextRequest, NextResponse } from "next/server";
import {
  destroySession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/auth/request";
import { getEnv } from "@/lib/env";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return new NextResponse("Forbidden", { status: 403 });
  try {
    await destroySession(request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    console.error("Session revocation failed: check database availability.");
    return new NextResponse("Logout could not complete. Please try again.", {
      status: 503,
    });
  }
  const response = NextResponse.redirect(
    new URL("/login", getEnv().APP_ORIGIN),
    303,
  );
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
