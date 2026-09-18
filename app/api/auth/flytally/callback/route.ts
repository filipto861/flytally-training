import { NextResponse } from "next/server";

import { verifyFlyTallyIdentityAssertion } from "@/lib/identity-contract";
import { consumeFlyTallyIdentityAssertion } from "@/lib/identity-replay";
import { safeLocalPath } from "@/lib/local-path";
import { createTrainingSessionToken, TRAINING_SESSION_COOKIE } from "@/lib/training-session";
import { trainingSessionSeconds } from "@/lib/training-session-policy";

function identitySecret(): string {
  const value = process.env.FLYTALLY_IDENTITY_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("FLYTALLY_IDENTITY_SECRET must contain at least 32 characters.");
  return value;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, {
    status,
    headers: { "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assertion = url.searchParams.get("assertion") ?? "";
  let claims;
  try { claims = verifyFlyTallyIdentityAssertion(assertion, identitySecret()); } catch { claims = null; }
  if (!claims) return errorResponse("invalid_identity_assertion", 401);

  let sessionToken: string;
  try { sessionToken = createTrainingSessionToken(claims.sub, claims.role, claims.entitlements); }
  catch { return errorResponse("training_session_not_configured", 503); }

  let consumed = false;
  try { consumed = await consumeFlyTallyIdentityAssertion(claims.jti, claims.exp); }
  catch { return errorResponse("identity_replay_guard_unavailable", 503); }
  if (!consumed) return errorResponse("identity_assertion_replayed", 401);

  const response = NextResponse.redirect(new URL(safeLocalPath(url.searchParams.get("next")), url.origin));
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  response.cookies.set(TRAINING_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: trainingSessionSeconds(claims.role),
  });
  return response;
}
