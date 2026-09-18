import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ENTITLEMENT_IDENTITY_VERSION,
  encodeSignedPayload,
  verifyFlyTallyIdentityAssertion,
} from "../lib/identity-contract.ts";
import {
  hasActiveEntitlement,
  legacyBetaEntitlements,
  parseEntitlementGrants,
} from "../lib/entitlements.ts";

const secret = "0123456789abcdef0123456789abcdef";
const now = 1_800_000_000;
const base = { iss: "flytally-logbook", aud: "flytally-training", sub: "42", role: "user", iat: now, exp: now + 120, jti: "assertion-123" };

test("C3 ft2 identity assertion carries a validated provider-agnostic entitlement snapshot", () => {
  const token = encodeSignedPayload({
    ...base,
    entitlementVersion: 1,
    entitlements: [
      { key: "logbook.access", source: "private-beta", validUntil: null },
      { key: "training.access", source: "private-beta", validUntil: now + 3600 },
    ],
  }, secret, ENTITLEMENT_IDENTITY_VERSION);

  const claims = verifyFlyTallyIdentityAssertion(token, secret, now + 10);
  assert.ok(claims);
  assert.equal(claims.identityVersion, "ft2");
  assert.equal(claims.entitlementVersion, 1);
  assert.equal(claims.entitlements.length, 2);
  assert.equal(hasActiveEntitlement(claims.entitlements, "training.access", now + 10), true);
  assert.equal(hasActiveEntitlement(claims.entitlements, "training.access", now + 3601), false);
});

test("C3 rejects malformed, duplicate or unknown-version entitlement snapshots", () => {
  const duplicate = encodeSignedPayload({
    ...base,
    entitlementVersion: 1,
    entitlements: [
      { key: "training.access", source: "billing", validUntil: null },
      { key: "training.access", source: "manual", validUntil: null },
    ],
  }, secret, ENTITLEMENT_IDENTITY_VERSION);
  assert.equal(verifyFlyTallyIdentityAssertion(duplicate, secret, now), null);

  const wrongVersion = encodeSignedPayload({
    ...base,
    entitlementVersion: 2,
    entitlements: [{ key: "training.access", source: "billing", validUntil: null }],
  }, secret, ENTITLEMENT_IDENTITY_VERSION);
  assert.equal(verifyFlyTallyIdentityAssertion(wrongVersion, secret, now), null);

  assert.equal(parseEntitlementGrants([{ key: "../training", source: "billing", validUntil: null }]), null);
});

test("C3 preserves ft1 and pre-C3 beta access during coordinated rollout", () => {
  const token = encodeSignedPayload(base, secret);
  const claims = verifyFlyTallyIdentityAssertion(token, secret, now + 10);
  assert.ok(claims);
  assert.equal(claims.identityVersion, "ft1");
  assert.deepEqual(claims.entitlements, legacyBetaEntitlements());
  assert.equal(hasActiveEntitlement(claims.entitlements, "training.access", now + 10), true);
});

test("C3 callback and Training session persist the signed entitlement snapshot", () => {
  const root=path.resolve(import.meta.dirname,"..");
  const callback=fs.readFileSync(path.join(root,"app/api/auth/flytally/callback/route.ts"),"utf8");
  const session=fs.readFileSync(path.join(root,"lib/training-session.ts"),"utf8");

  assert.match(callback,/training_entitlement_required/);
  assert.match(callback,/createTrainingSessionToken\(claims\.sub, claims\.role, claims\.entitlements\)/);
  assert.match(session,/entitlementVersion/);
  assert.match(session,/hasTrainingAccess\(session\)/);
  assert.match(session,/legacyBetaEntitlements/);
});
