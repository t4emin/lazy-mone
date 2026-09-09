import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireSession, sessionCookieOptions } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
export async function GET() {
  await requireSession();
  const clientId = process.env.FACEBOOK_CLIENT_ID?.trim();
  if (!clientId)
    return NextResponse.redirect(
      new URL("/settings?facebook=missing_config", getEnv().APP_ORIGIN),
    );
  const state = randomBytes(32).toString("hex");
  const redirectUri = `${getEnv().APP_ORIGIN}/api/social/facebook/callback`;
  const url = new URL("https://www.facebook.com/v22.0/dialog/oauth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: "pages_show_list,pages_manage_posts",
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("facebook_oauth_state", state, {
    ...sessionCookieOptions,
    maxAge: 600,
  });
  return response;
}
