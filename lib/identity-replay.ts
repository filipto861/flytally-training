import "server-only";

import { sql } from "./db";

export async function consumeFlyTallyIdentityAssertion(jti: string, expiresAtSeconds: number): Promise<boolean> {
  if (jti.length < 8 || jti.length > 128 || !Number.isInteger(expiresAtSeconds)) return false;
  const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();
  const rows = await sql`INSERT INTO training_identity_assertions(jti,expires_at)
    VALUES(${jti},${expiresAt})
    ON CONFLICT(jti) DO NOTHING
    RETURNING jti` as Array<{jti:string}>;
  return Boolean(rows[0]);
}
