import { createHmac, timingSafeEqual } from "node:crypto";

export type FlyTallyIdentityRole = "admin" | "user";

export type FlyTallyIdentityClaims = {
  readonly iss: "flytally-logbook";
  readonly aud: "flytally-training";
  readonly sub: string;
  readonly role: FlyTallyIdentityRole;
  readonly iat: number;
  readonly exp: number;
  readonly jti: string;
};

const VERSION = "ft1";
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

export function encodeSignedPayload(payload: object, secret: string, version = VERSION): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const input = `${version}.${encoded}`;
  return `${input}.${signature(input, secret)}`;
}

export function decodeSignedPayload<T extends object>(token: string, secret: string, version = VERSION): T | null {
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

export function verifyFlyTallyIdentityAssertion(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): FlyTallyIdentityClaims | null {
  const claims = decodeSignedPayload<Partial<FlyTallyIdentityClaims>>(token, secret);
  if (!claims) return null;
  if (claims.iss !== "flytally-logbook" || claims.aud !== "flytally-training") return null;
  if (typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128) return null;
  if (claims.role !== "admin" && claims.role !== "user") return null;
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) return null;
  if (typeof claims.jti !== "string" || claims.jti.length < 8 || claims.jti.length > 128) return null;
  if (claims.iat! > nowSeconds + CLOCK_SKEW_SECONDS) return null;
  if (claims.exp! <= nowSeconds - CLOCK_SKEW_SECONDS) return null;
  if (claims.exp! <= claims.iat! || claims.exp! - claims.iat! > MAX_ASSERTION_SECONDS) return null;
  return claims as FlyTallyIdentityClaims;
}
