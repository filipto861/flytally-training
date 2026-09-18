import { createHmac, timingSafeEqual } from "node:crypto";

import {
  FLYTALLY_ENTITLEMENT_VERSION,
  legacyBetaEntitlements,
  parseEntitlementGrants,
  type FlyTallyEntitlementGrant,
} from "./entitlements.ts";

export type FlyTallyIdentityRole = "admin" | "user";

type FlyTallyIdentityBaseClaims = {
  readonly iss: "flytally-logbook";
  readonly aud: "flytally-training";
  readonly sub: string;
  readonly role: FlyTallyIdentityRole;
  readonly iat: number;
  readonly exp: number;
  readonly jti: string;
};

type FlyTallyIdentityV2Payload = FlyTallyIdentityBaseClaims & {
  readonly entitlementVersion: typeof FLYTALLY_ENTITLEMENT_VERSION;
  readonly entitlements: readonly FlyTallyEntitlementGrant[];
};

export type FlyTallyIdentityClaims = FlyTallyIdentityBaseClaims & {
  readonly identityVersion: "ft1" | "ft2";
  readonly entitlementVersion: typeof FLYTALLY_ENTITLEMENT_VERSION;
  readonly entitlements: readonly FlyTallyEntitlementGrant[];
};

const LEGACY_VERSION = "ft1";
export const ENTITLEMENT_IDENTITY_VERSION = "ft2";
const MAX_ASSERTION_SECONDS = 5 * 60;
const CLOCK_SKEW_SECONDS = 30;

function requireSecret(secret: string): string {
  const value = secret.trim();
  if (value.length < 32) throw new Error("FlyTally identity secret must contain at least 32 characters.");
  return value;
}

function signature(input: string, secret: string): string {
  return createHmac("sha256", requireSecret(secret)).update(input).digest("base64url");
}

export function encodeSignedPayload(payload: object, secret: string, version = LEGACY_VERSION): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const input = `${version}.${encoded}`;
  return `${input}.${signature(input, secret)}`;
}

export function decodeSignedPayload<T extends object>(token: string, secret: string, version = LEGACY_VERSION): T | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== version) return null;
  const input = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signature(input, secret));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
}

function validateBaseClaims(
  claims: Partial<FlyTallyIdentityBaseClaims>,
  nowSeconds: number,
): boolean {
  if (claims.iss !== "flytally-logbook" || claims.aud !== "flytally-training") return false;
  if (typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128) return false;
  if (claims.role !== "admin" && claims.role !== "user") return false;
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) return false;
  if (typeof claims.jti !== "string" || claims.jti.length < 8 || claims.jti.length > 128) return false;
  if (claims.iat! > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (claims.exp! <= nowSeconds - CLOCK_SKEW_SECONDS) return false;
  if (claims.exp! <= claims.iat! || claims.exp! - claims.iat! > MAX_ASSERTION_SECONDS) return false;
  return true;
}

export function verifyFlyTallyIdentityAssertion(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): FlyTallyIdentityClaims | null {
  const v2 = decodeSignedPayload<Partial<FlyTallyIdentityV2Payload>>(token, secret, ENTITLEMENT_IDENTITY_VERSION);
  if (v2) {
    if (!validateBaseClaims(v2, nowSeconds)) return null;
    if (v2.entitlementVersion !== FLYTALLY_ENTITLEMENT_VERSION) return null;
    const entitlements = parseEntitlementGrants(v2.entitlements);
    if (!entitlements) return null;
    return {
      ...v2,
      identityVersion: "ft2",
      entitlementVersion: FLYTALLY_ENTITLEMENT_VERSION,
      entitlements,
    } as FlyTallyIdentityClaims;
  }

  const legacy = decodeSignedPayload<Partial<FlyTallyIdentityBaseClaims>>(token, secret, LEGACY_VERSION);
  if (!legacy || !validateBaseClaims(legacy, nowSeconds)) return null;

  return {
    ...legacy,
    identityVersion: "ft1",
    entitlementVersion: FLYTALLY_ENTITLEMENT_VERSION,
    entitlements: legacyBetaEntitlements(),
  } as FlyTallyIdentityClaims;
}
