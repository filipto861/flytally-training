import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet3536 } from "../lib/aircraft-catalog.ts";
import { isSimulatorOnlyAuthority, parseSourceAuthorityRole, sourceAuthorityRoles } from "../lib/source-authority.ts";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";

const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");
const adminPage = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

test("M9 source authority taxonomy is explicit and closed", () => {
  assert.deepEqual(sourceAuthorityRoles, [
    "CONTROLLING",
    "OPERATING_REFERENCE",
    "TRAINING_REFERENCE",
    "SIMULATOR_IMPLEMENTATION",
    "SIMULATOR_WORKFLOW",
    "UNCLASSIFIED",
  ]);
  assert.equal(parseSourceAuthorityRole("TRAINING_REFERENCE"), "TRAINING_REFERENCE");
  assert.throws(() => parseSourceAuthorityRole("AIRCRAFT_MANUAL_BUT_TRUST_ME"), /Unsupported source authority role/);
  assert.equal(isSimulatorOnlyAuthority("TRAINING_REFERENCE"), false);
  assert.equal(isSimulatorOnlyAuthority("SIMULATOR_WORKFLOW"), true);
});

test("Learjet learner seed is anchored only to the FlightSafety real-aircraft training source", () => {
  assert.deepEqual(learjet3536.manuals.map(source => source.id), ["fsi-learjet-35-36-ptm-r1-1"]);
  assert.equal(learjet3536.manuals[0]?.authorityRole, "TRAINING_REFERENCE");
  assert.ok(!(staticTrainingContentSeed.universalModules ?? []).some(module => module.domain === "flows"));
});

test("publication and bootstrap enforce module-to-source identity instead of aircraft-wide provenance", () => {
  assert.match(governance, /assertEmbeddedSourcesMatchVersionLinks/);
  assert.match(governance, /Version source links do not match embedded content sources/);
  assert.match(bootstrap, /selectContentSourceReferenceIds/);
  assert.match(bootstrap, /isSimulatorOnlyAuthority/);
  assert.match(bootstrap, /legacyFallbackByAircraft/);
});

test("admin source registration retains explicit authority classification as provenance metadata", () => {
  assert.match(adminPage, /name="authorityRole"/);
  assert.match(adminPage, /sourceAuthorityRoles\.map/);
});
