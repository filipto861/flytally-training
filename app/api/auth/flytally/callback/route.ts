import { NextResponse } from "next/server";

import { verifyFlyTallyIdentityAssertion } from "@/lib/identity-contract";
import { createTrainingSessionToken, TRAINING_SESSION_COOKIE, TRAINING_SESSION_SECONDS } from "@/lib/training-session";

function identitySecret(): string {
  const value = process.env.FLYTALLY_IDENTITY_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("FLYTALLY_IDENTITY_SECRET must contain at least 32 characters.");
  return value;
}

function localPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assertion = url.searchParams.get("assertion") ?? "";
  let claims;
  try { claims = verifyFlyTallyIdentityAssertion(assertion, identitySecret()); } catch { claims = null; }
  if (!claims) return NextResponse.json({ error: "invalid_identity_assertion" }, { status: 401 });

  const response = NextResponse.redirect(new URL(localPath(url.searchParams.get("next")), url.origin));
  response.cookies.set(TRAINING_SESSION_COOKIE, createTrainingSessionToken(claims.sub, claims.role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRAINING_SESSION_SECONDS,
  });
  return response;
}
