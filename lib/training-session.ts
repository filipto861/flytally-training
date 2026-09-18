import "server-only";

import { cookies } from "next/headers";

import {
  FLYTALLY_ENTITLEMENT_VERSION,
  hasActiveEntitlement,
  legacyBetaEntitlements,
  parseEntitlementGrants,
  type FlyTallyEntitlementGrant,
} from "./entitlements.ts";
import { decodeSignedPayload, encodeSignedPayload, type FlyTallyIdentityRole } from "./identity-contract.ts";
import { isTrainingSessionLifetimeAllowed, trainingSessionSeconds } from "./training-session-policy";

export const TRAINING_SESSION_COOKIE = "flytally_training_session";
const VERSION = "fts1";

type TrainingSessionClaims = {
  readonly sub: string;
  readonly role: FlyTallyIdentityRole;
  readonly iat: number;
  readonly exp: number;
  readonly entitlementVersion?: number;
  readonly entitlements?: readonly FlyTallyEntitlementGrant[];
};

export type TrainingSession = {
  readonly subject: string;
  readonly role: FlyTallyIdentityRole;
  readonly exp: number;
  readonly entitlementVersion: typeof FLYTALLY_ENTITLEMENT_VERSION;
  readonly entitlements: readonly FlyTallyEntitlementGrant[];
};

function sessionSecret(): string {
  const value = process.env.TRAINING_SESSION_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("TRAINING_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

export function createTrainingSessionToken(
  subject: string,
  role: FlyTallyIdentityRole,
  entitlements: readonly FlyTallyEntitlementGrant[],
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const parsed = parseEntitlementGrants(entitlements);
  if (!parsed) throw new Error("Invalid FlyTally entitlement snapshot.");
  const lifetime = trainingSessionSeconds(role);
  return encodeSignedPayload({
    sub: subject,
    role,
    iat: nowSeconds,
    exp: nowSeconds + lifetime,
    entitlementVersion: FLYTALLY_ENTITLEMENT_VERSION,
    entitlements: parsed,
  }, sessionSecret(), VERSION);
}

export function readTrainingSessionToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)): TrainingSession | null {
  const claims = decodeSignedPayload<Partial<TrainingSessionClaims>>(token, sessionSecret(), VERSION);
  if (!claims || typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128) return null;
  if (claims.role !== "admin" && claims.role !== "user") return null;
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp) || claims.exp! <= nowSeconds || claims.iat! > nowSeconds + 30) return null;
  if (!isTrainingSessionLifetimeAllowed(claims.role, claims.iat!, claims.exp!)) return null;

  // Sessions issued before C3 did not contain an entitlement snapshot. Preserve
  // those beta sessions until their normal expiry; all new sessions carry ft2 data.
  const entitlements = claims.entitlementVersion === undefined && claims.entitlements === undefined
    ? legacyBetaEntitlements()
    : claims.entitlementVersion === FLYTALLY_ENTITLEMENT_VERSION
      ? parseEntitlementGrants(claims.entitlements)
      : null;

  if (!entitlements) return null;

  return {
    subject: claims.sub,
    role: claims.role,
    exp: claims.exp!,
    entitlementVersion: FLYTALLY_ENTITLEMENT_VERSION,
    entitlements,
  };
}

export function hasTrainingAccess(
  session: TrainingSession,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return hasActiveEntitlement(session.entitlements, "training.access", nowSeconds);
}

export async function getTrainingSession(): Promise<TrainingSession | null> {
  const token = (await cookies()).get(TRAINING_SESSION_COOKIE)?.value;
  if (!token) return null;
  try { return readTrainingSessionToken(token); } catch { return null; }
}
