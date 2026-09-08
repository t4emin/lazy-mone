import "server-only";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return (
    origin === getEnv().APP_ORIGIN &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
