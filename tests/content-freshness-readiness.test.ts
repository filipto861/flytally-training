import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const freshness = fs.readFileSync(new URL("../lib/content-freshness.ts", import.meta.url), "utf8");
const readiness = fs.readFileSync(new URL("../app/api/readiness/route.ts", import.meta.url), "utf8");

test("content freshness considers unresolved flags on whatever training modules are currently published", () => {
  assert.match(freshness,/FROM training_content_publications p/);
  assert.match(freshness,/sf\.version_id=p\.version_id/);
  assert.match(freshness,/i\.content_key='bundle'/);
  assert.match(freshness,/i\.domain<>'orientation'/);
  assert.match(freshness,/sf\.resolved_at IS NULL/);
  assert.doesNotMatch(freshness,/'learning','normal-flight','orientation','abnormal','reference-knowledge'/);
  assert.doesNotMatch(freshness,/state='stale'/);
});

test("readiness requires one usable aircraft to be controlled and fresh", () => {
  assert.match(readiness,/hasUsableAircraftTrainingContent/);
  assert.match(readiness,/hasFreshCurrentPublishedContent\(item\.id\)/);
  assert.match(readiness,/controlledCoverage && freshContent/);
  assert.match(readiness,/releaseReadyAircraft = true/);
  assert.match(readiness,/&& currentContentFreshness/);
  assert.match(readiness,/&& releaseReadyAircraft/);
  assert.match(readiness,/&& modularAircraftContent/);
  assert.doesNotMatch(readiness,/learjet-35-36/i);
});
