import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const publication = fs.readFileSync(new URL("../lib/aircraft-publication.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

test("learner catalogue publication requires a manual and every canonical bundle", () => {
  assert.match(publication, /EXISTS\([\s\S]*training_manual_revisions/);
  assert.match(publication, /COUNT\(DISTINCT i\.domain\)::int/);
  assert.match(publication, /i\.content_key='bundle'/);
  assert.match(publication, /'learning','normal-flight','orientation','abnormal','reference-knowledge'/);
  assert.match(publication, /e\.published_domains=\$\{trainingContentDomains\.length\}/);
  assert.match(publication, /SET status='published',updated_at=NOW\(\)/);
});

test("catalogue publication refuses unresolved stale flags on the effective canonical versions", () => {
  assert.match(publication,/JOIN training_content_stale_flags sf ON sf\.version_id=p\.version_id/);
  assert.match(publication,/sf\.resolved_at IS NULL/);
  assert.match(publication,/AS current_content_fresh/);
  assert.match(publication,/AND e\.current_content_fresh/);
});

test("interactive aircraft publication uses the governed completeness gate", () => {
  assert.match(actions, /publishGovernedAircraft/);
  assert.match(actions, /await publishGovernedAircraft\(aircraftId\)/);
  assert.doesNotMatch(actions, /\bawait publishAircraft\(aircraftId\)/);
});

test("catalogue gate stays distinct from the stricter controlled-Blob release gate", () => {
  assert.match(publication, /Controlled-Blob availability remains the stricter/);
  assert.doesNotMatch(publication, /training_manual_assets/);
});
