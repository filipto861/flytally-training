import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet3536 } from "../lib/aircraft-catalog.ts";
import { learjet3536NativeFlows } from "../lib/learjet-native-flows.ts";
import { isSimulatorOnlyAuthority, parseSourceAuthorityRole, sourceAuthorityRoles } from "../lib/source-authority.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";

const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");
const adminPage = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/page.tsx", import.meta.url), "utf8");

const manual = (id: string) => learjet3536.manuals.find(source => source.id === id);

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
});

test("Learjet training and simulator sources cannot masquerade as the same authority", () => {
  const fsi = manual("fsi-learjet-35-36-ptm-r1-1");
  const jaydee = manual("jaydee-learjet-35a-msfs-guide-v1-35-wip1");
  const flysimware = manual("flysimware-learjet-35a-msfs-v1-2");

  assert.equal(fsi?.authorityRole, "TRAINING_REFERENCE");
  assert.equal(jaydee?.authorityRole, "SIMULATOR_WORKFLOW");
  assert.equal(flysimware?.authorityRole, "SIMULATOR_IMPLEMENTATION");
  assert.equal(isSimulatorOnlyAuthority(fsi!.authorityRole), false);
  assert.equal(isSimulatorOnlyAuthority(jaydee!.authorityRole), true);
  assert.equal(isSimulatorOnlyAuthority(flysimware!.authorityRole), true);
  assert.match(jaydee?.authorityNote ?? "", /simulator.*not an aircraft operating authority/i);
  assert.match(flysimware?.authorityNote ?? "", /not as an aircraft operating authority/i);
});

test("native Learjet flows validate and cite only the simulator workflow source", () => {
  assert.deepEqual(validateContentPayload("flows", learjet3536NativeFlows, "learjet-35-36"), []);
  assert.match(learjet3536NativeFlows.disclaimer ?? "", /SIMULATOR WORKFLOW ONLY/);
  assert.ok(learjet3536NativeFlows.flows.length >= 6);
  for (const flow of learjet3536NativeFlows.flows) {
    assert.deepEqual(flow.applicability?.variants, ["35A"]);
    assert.ok(flow.sources?.every(source => source.manualId === "jaydee-learjet-35a-msfs-guide-v1-35-wip1"));
    assert.ok(flow.steps.every(step => step.sources?.length && step.sources.every(source => source.manualId === "jaydee-learjet-35a-msfs-guide-v1-35-wip1")));
  }
});

test("publication and bootstrap enforce module-to-source identity instead of aircraft-wide provenance", () => {
  assert.match(governance, /assertEmbeddedSourcesMatchVersionLinks/);
  assert.match(governance, /Version source links do not match embedded content sources/);
  assert.match(bootstrap, /selectContentSourceReferenceIds/);
  assert.match(bootstrap, /isSimulatorOnlyAuthority/);
  assert.match(bootstrap, /legacyFallbackByAircraft/);
});

test("admin source registration requires an explicit authority classification", () => {
  assert.match(adminPage, /name="authorityRole"/);
  assert.match(adminPage, /sourceAuthorityRoles\.map/);
  assert.match(adminPage, /SIMULATOR_MANUAL \/ SIMULATOR_GUIDE/);
});
