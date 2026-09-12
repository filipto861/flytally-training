import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { isSimulatorOnlyAuthority, parseSourceAuthorityRole, sourceAuthorityRoles } from "../lib/source-authority.ts";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";

const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");
const sourcesPage = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/sources/page.tsx", import.meta.url), "utf8");

test("source authority taxonomy is explicit and closed", () => {
  assert.deepEqual(sourceAuthorityRoles, ["CONTROLLING", "OPERATING_REFERENCE", "TRAINING_REFERENCE", "SIMULATOR_IMPLEMENTATION", "SIMULATOR_WORKFLOW", "UNCLASSIFIED"]);
  assert.equal(parseSourceAuthorityRole("TRAINING_REFERENCE"), "TRAINING_REFERENCE");
  assert.throws(() => parseSourceAuthorityRole("AIRCRAFT_MANUAL_BUT_TRUST_ME"), /Unsupported source authority role/);
  assert.equal(isSimulatorOnlyAuthority("TRAINING_REFERENCE"), false);
  assert.equal(isSimulatorOnlyAuthority("SIMULATOR_WORKFLOW"), true);
});

test("retired static aircraft cannot remain as hidden source-authority content", () => {
  assert.equal(staticTrainingContentSeed.aircraft.length, 0);
  assert.equal(staticTrainingContentSeed.nativeModules?.length ?? 0, 0);
});

test("publication and bootstrap enforce module-to-source identity instead of aircraft-wide provenance", () => {
  assert.match(governance, /assertEmbeddedSourcesMatchVersionLinks/);
  assert.match(governance, /Version source links do not match embedded content sources/);
  assert.match(bootstrap, /selectContentSourceReferenceIds/);
  assert.match(bootstrap, /isSimulatorOnlyAuthority/);
  assert.match(bootstrap, /legacyFallbackByAircraft/);
});

test("admin source registration retains explicit authority classification as provenance metadata", () => {
  assert.match(sourcesPage, /name="authorityRole"/);
  assert.match(sourcesPage, /sourceAuthorityRoles\.map/);
});
