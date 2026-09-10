import "server-only";

import { cookies } from "next/headers";
import { decodeSignedPayload, encodeSignedPayload, type FlyTallyIdentityRole } from "./identity-contract";

export const TRAINING_SESSION_COOKIE = "flytally_training_session";
export const TRAINING_SESSION_SECONDS = 60 * 60 * 24 * 7;
const VERSION = "fts1";

type TrainingSessionClaims = {
  readonly sub: string;
  readonly role: FlyTallyIdentityRole;
  readonly iat: number;
  readonly exp: number;
};

export type TrainingSession = {
  readonly subject: string;
  readonly role: FlyTallyIdentityRole;
  readonly exp: number;
};

function sessionSecret(): string {
  const value = process.env.TRAINING_SESSION_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("TRAINING_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

export function createTrainingSessionToken(subject: string, role: FlyTallyIdentityRole, nowSeconds = Math.floor(Date.now() / 1000)): string {
  return encodeSignedPayload({ sub: subject, role, iat: nowSeconds, exp: nowSeconds + TRAINING_SESSION_SECONDS }, sessionSecret(), VERSION);
}

export function readTrainingSessionToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)): TrainingSession | null {
  const claims = decodeSignedPayload<Partial<TrainingSessionClaims>>(token, sessionSecret(), VERSION);
  if (!claims || typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128) return null;
  if (claims.role !== "admin" && claims.role !== "user") return null;
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp) || claims.exp! <= nowSeconds || claims.iat! > nowSeconds + 30) return null;
  return { subject: claims.sub, role: claims.role, exp: claims.exp! };
}

export async function getTrainingSession(): Promise<TrainingSession | null> {
  const token = (await cookies()).get(TRAINING_SESSION_COOKIE)?.value;
  if (!token) return null;
  try { return readTrainingSessionToken(token); } catch { return null; }
}
