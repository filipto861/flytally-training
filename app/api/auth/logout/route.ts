import { NextResponse } from "next/server";
import { TRAINING_SESSION_COOKIE } from "@/lib/training-session";
import { isTrustedMutationRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "untrusted_origin" }, { status: 403, headers: { "cache-control": "private, no-store" } });
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.headers.set("cache-control", "private, no-store");
  response.cookies.set(TRAINING_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
