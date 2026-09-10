import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manualAssets = fs.readFileSync(new URL("../lib/manual-assets.ts", import.meta.url), "utf8");
const adminPage = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

test("controlled manual finalization hashes the stored private bytes before readiness", () => {
  assert.match(manualAssets, /import \{ get, head, issueSignedToken, presignUrl \} from "@vercel\/blob"/);
  assert.match(manualAssets, /await get\(blob\.url, \{ access: "private" \}\)/);
  assert.match(manualAssets, /await sha256ReadableStream\(stored\.stream\)/);
  assert.match(manualAssets, /verified\.bytes === Number\(row\.size_bytes\)/);
  assert.match(manualAssets, /verified\.sha256 === row\.checksum_sha256\.toLowerCase\(\)/);
  const checksumGate = manualAssets.indexOf("verified.sha256 === row.checksum_sha256.toLowerCase()");
  const readyWrite = manualAssets.indexOf("SET status='ready'");
  assert.ok(checksumGate >= 0 && readyWrite > checksumGate, "ready state must occur only after checksum verification");
});

test("manual upload URL cannot overwrite an already stored controlled object", () => {
  assert.match(manualAssets, /allowOverwrite: false/);
});

test("transient storage verification failures remain retryable while proven mismatches fail closed", () => {
  assert.match(manualAssets, /error instanceof ManualAssetIntegrityError/);
  assert.match(manualAssets, /status='failed'/);
  assert.match(adminPage, /recompute SHA-256 and byte count/);
});
