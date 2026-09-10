import type { FlyTallyIdentityRole } from "./identity-contract.ts";

export const USER_TRAINING_SESSION_SECONDS = 60 * 60 * 24 * 7;
export const ADMIN_TRAINING_SESSION_SECONDS = 60 * 60 * 12;

/**
 * Learner sessions can remain convenient across devices, while privileged
 * administration sessions deliberately have a much smaller stale-role window.
 */
export function trainingSessionSeconds(role: FlyTallyIdentityRole): number {
  return role === "admin" ? ADMIN_TRAINING_SESSION_SECONDS : USER_TRAINING_SESSION_SECONDS;
}

/**
 * Enforce the current role-specific lifetime when reading an already-issued
 * token too. This immediately rejects legacy seven-day admin cookies after the
 * policy is deployed instead of waiting for their old expiry time.
 */
export function isTrainingSessionLifetimeAllowed(
  role: FlyTallyIdentityRole,
  iat: number,
  exp: number,
): boolean {
  return Number.isInteger(iat)
    && Number.isInteger(exp)
    && exp > iat
    && exp - iat <= trainingSessionSeconds(role);
}
