import assert from "node:assert/strict";
import test from "node:test";

import { encodeSignedPayload, verifyFlyTallyIdentityAssertion } from "../lib/identity-contract.ts";

const secret = "0123456789abcdef0123456789abcdef";
const now = 1_800_000_000;
const valid = { iss: "flytally-logbook", aud: "flytally-training", sub: "42", role: "user", iat: now, exp: now + 120, jti: "assertion-123" };

test("FlyTally identity assertion verifies the explicit issuer/audience contract", () => {
  const token = encodeSignedPayload(valid, secret);
  const claims = verifyFlyTallyIdentityAssertion(token, secret, now + 10);
  assert.ok(claims);
  assert.equal(claims.sub, "42");
  assert.equal(claims.role, "user");
});

test("identity assertion rejects tampering and wrong audience", () => {
  const token = encodeSignedPayload(valid, secret);
  assert.equal(verifyFlyTallyIdentityAssertion(`${token}x`, secret, now), null);
  const wrongAudience = encodeSignedPayload({ ...valid, aud: "other-product" }, secret);
  assert.equal(verifyFlyTallyIdentityAssertion(wrongAudience, secret, now), null);
});

test("identity assertion rejects expired or excessively long assertions", () => {
  assert.equal(verifyFlyTallyIdentityAssertion(encodeSignedPayload({ ...valid, exp: now - 60 }, secret), secret, now), null);
  assert.equal(verifyFlyTallyIdentityAssertion(encodeSignedPayload({ ...valid, exp: now + 600 }, secret), secret, now), null);
});
