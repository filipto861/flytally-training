import { decodeSignedPayload } from "./identity-contract.ts";

export const TRAINING_PRIVACY_ERASURE_VERSION = "ftp1";
const MAX_ASSERTION_SECONDS = 2 * 60;
const CLOCK_SKEW_SECONDS = 30;

export type TrainingPrivacyErasureClaims = {
  readonly iss: "flytally-logbook";
  readonly aud: "flytally-training";
  readonly purpose: "erase-training-data";
  readonly sub: string;
  readonly iat: number;
  readonly exp: number;
  readonly jti: string;
};

function identitySecret(): string {
  const value=process.env.FLYTALLY_IDENTITY_SECRET?.trim();
  if(!value||value.length<32)throw new Error("FLYTALLY_IDENTITY_SECRET must contain at least 32 characters.");
  return value;
}

/**
 * Purpose-bound service assertion used only by Logbook account deletion.
 * The assertion is deliberately a different token version from interactive SSO.
 * Replay is harmless because Training erasure is idempotent and only advances
 * the privacy reset boundary.
 */
export function verifyTrainingPrivacyErasureAssertion(
  token:string,
  nowSeconds=Math.floor(Date.now()/1000),
):TrainingPrivacyErasureClaims|null{
  const claims=decodeSignedPayload<Partial<TrainingPrivacyErasureClaims>>(
    token,
    identitySecret(),
    TRAINING_PRIVACY_ERASURE_VERSION,
  );
  if(!claims)return null;
  if(claims.iss!=="flytally-logbook"||claims.aud!=="flytally-training"||claims.purpose!=="erase-training-data")return null;
  if(typeof claims.sub!=="string"||claims.sub.length<1||claims.sub.length>128)return null;
  if(!Number.isInteger(claims.iat)||!Number.isInteger(claims.exp))return null;
  if(typeof claims.jti!=="string"||claims.jti.length<8||claims.jti.length>128)return null;
  if(claims.iat!>nowSeconds+CLOCK_SKEW_SECONDS)return null;
  if(claims.exp!<=nowSeconds-CLOCK_SKEW_SECONDS)return null;
  if(claims.exp!<=claims.iat!||claims.exp!-claims.iat!>MAX_ASSERTION_SECONDS)return null;
  return claims as TrainingPrivacyErasureClaims;
}
