import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const registration = fs.readFileSync(new URL("../lib/governed-manual-registration.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

test("admin manual registration uses one PostgreSQL transaction for revision, stale flags and asset attachment", () => {
  assert.match(registration, /sql\.transaction\(\(txn\) => \[/);
  assert.match(registration, /SET status='claimed'/);
  assert.match(registration, /INSERT INTO training_manual_revisions/);
  assert.match(registration, /INSERT INTO training_content_stale_flags/);
  assert.match(registration, /SET status='attached',attached_revision_id=/);
});

test("controlled asset URI and checksum are derived from the verified database row", () => {
  assert.match(registration, /a\.blob_url,a\.checksum_sha256/);
  assert.match(registration, /a\.status='claimed'/);
  assert.match(registration, /a\.claimed_by=\$\{subject\}/);
});

test("a manual family cannot be silently reused across aircraft", () => {
  assert.match(registration, /manual_id=\$\{manualId\} AND aircraft_id=\$\{aircraftId\}/);
  assert.match(registration, /Manual family belongs to another aircraft/);
});

test("server action no longer performs a claim-register-attach sequence outside the transaction", () => {
  assert.match(actions, /registerGovernedManualRevision/);
  assert.doesNotMatch(actions, /claimManualAsset|attachClaimedManualAsset|releaseManualAssetClaim/);
});
