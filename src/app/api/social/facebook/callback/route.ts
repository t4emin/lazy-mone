import { NextRequest, NextResponse } from "next/server";
import { requireSession, sessionCookieOptions } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { saveFacebookPage } from "@/lib/social/service";
export async function GET(request: NextRequest) {
  const { user } = await requireSession();
  const origin = getEnv().APP_ORIGIN;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (
    !state ||
    state !== request.cookies.get("facebook_oauth_state")?.value ||
    !code
  )
    return NextResponse.redirect(new URL("/settings?facebook=failed", origin));
  try {
    const redirectUri = `${origin}/api/social/facebook/callback`;
    const tokenUrl = new URL(
      "https://graph.facebook.com/v22.0/oauth/access_token",
    );
    tokenUrl.search = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
    }).toString();
    const token = await fetch(tokenUrl, { cache: "no-store" }).then(
      async (r) => {
        if (!r.ok) throw new Error("token");
        return r.json() as Promise<{ access_token: string }>;
      },
    );
    const pages = await fetch(
      "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      },
    ).then(async (r) => {
      if (!r.ok) throw new Error("pages");
      return r.json() as Promise<{
        data: { id: string; name: string; access_token: string }[];
      }>;
    });
    if (!pages.data[0]) throw new Error("no_page");
    await saveFacebookPage(user.id, pages.data[0]);
    const response = NextResponse.redirect(
      new URL("/settings?facebook=connected", origin),
    );
    response.cookies.set("facebook_oauth_state", "", {
      ...sessionCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?facebook=failed", origin));
  }
}
