import { NextResponse } from "next/server";

function localPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
  const base = process.env.FLYTALLY_LOGBOOK_URL?.trim();
  if (!base) return NextResponse.json({ error: "identity_provider_not_configured" }, { status: 503 });
  let target: URL;
  try { target = new URL("/api/auth/training/start", base); } catch { return NextResponse.json({ error: "identity_provider_not_configured" }, { status: 503 }); }
  target.searchParams.set("next", localPath(new URL(request.url).searchParams.get("next")));
  return NextResponse.redirect(target);
}
