import { NextResponse } from "next/server";

import { safeLocalPath } from "@/lib/local-path";

export async function GET(request: Request) {
  const source = new URL(request.url);
  const base = process.env.FLYTALLY_LOGBOOK_URL?.trim();
  if (!base) return NextResponse.json({ error: "identity_provider_not_configured" }, { status: 503 });
  let target: URL;
  try { target = new URL("/api/auth/training/start", base); } catch { return NextResponse.json({ error: "identity_provider_not_configured" }, { status: 503 }); }
  target.searchParams.set("next", safeLocalPath(source.searchParams.get("next")));
  const response = NextResponse.redirect(target);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  return response;
}
