import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const registration = fs.readFileSync(new URL("../lib/governed-manual-registration.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

test("source revision registration is one PostgreSQL transaction for revision and stale flags", () => {
  assert.match(registration, /sql\.transaction\(\(txn\) => \[/);
  assert.match(registration, /INSERT INTO training_manual_revisions/);
  assert.match(registration, /INSERT INTO training_content_stale_flags/);
  assert.doesNotMatch(registration, /training_manual_assets|blob_url|status='claimed'|status='attached'/);
});

test("source record persists metadata and optional fingerprint without a document asset", () => {
  assert.match(registration, /source_metadata/);
  assert.match(registration, /checksum_sha256/);
  assert.match(registration, /documentHostedByFlyTally:false/);
  assert.doesNotMatch(registration, /@vercel\/blob|manualAsset/);
});

test("a source family cannot be silently reused across aircraft", () => {
  assert.match(registration, /m\.manual_id=\$\{manualId\} AND m\.aircraft_id=\$\{aircraftId\}/);
  assert.match(registration, /Manual family belongs to another aircraft/);
});

test("server action parses source evidence and has no asset lifecycle", () => {
  assert.match(actions, /parseSourceRecordEvidence/);
  assert.match(actions, /sourceMetadata:evidence\.sourceMetadata/);
  assert.doesNotMatch(actions, /assetId|claimManualAsset|attachClaimedManualAsset|releaseManualAssetClaim/);
});
