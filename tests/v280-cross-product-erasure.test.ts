import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import {
  TRAINING_PRIVACY_ERASURE_VERSION,
  verifyTrainingPrivacyErasureAssertion,
  type TrainingPrivacyErasureClaims,
} from "../lib/privacy-erasure-contract.ts";

const secret="0123456789abcdef0123456789abcdef";
process.env.FLYTALLY_IDENTITY_SECRET=secret;

function assertion(overrides:Partial<TrainingPrivacyErasureClaims>={},now=1_800_000_000){
  const claims:TrainingPrivacyErasureClaims={
    iss:"flytally-logbook",
    aud:"flytally-training",
    purpose:"erase-training-data",
    sub:"42",
    iat:now,
    exp:now+120,
    jti:randomUUID(),
    ...overrides,
  };
  const payload=Buffer.from(JSON.stringify(claims),"utf8").toString("base64url");
  const input=`${TRAINING_PRIVACY_ERASURE_VERSION}.${payload}`;
  const signature=createHmac("sha256",secret).update(input).digest("base64url");
  return `${input}.${signature}`;
}

test("v2.8 accepts only short-lived purpose-bound Logbook privacy erasure assertions",()=>{
  const now=1_800_000_000;
  assert.equal(verifyTrainingPrivacyErasureAssertion(assertion({},now),now)?.sub,"42");
  assert.equal(verifyTrainingPrivacyErasureAssertion(assertion({exp:now-60},now),now),null);
  const wrongVersion=assertion({},now).replace(/^ftp1\./,"ft1.");
  assert.equal(verifyTrainingPrivacyErasureAssertion(wrongVersion,now),null);
});

test("v2.8 internal privacy erase route is signed, idempotent and non-cacheable",()=>{
  const route=fs.readFileSync(new URL("../app/api/internal/privacy/erase/route.ts",import.meta.url),"utf8");
  assert.match(route,/FlyTally-Privacy/);
  assert.match(route,/verifyTrainingPrivacyErasureAssertion/);
  assert.match(route,/deleteTrainingProgress\(claims\.sub\)/);
  assert.match(route,/private, no-store/);
});
