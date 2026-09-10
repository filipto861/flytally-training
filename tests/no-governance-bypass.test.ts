import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const adminRepository = fs.readFileSync(new URL("../lib/content-admin-repository.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const governedLifecycle = fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts", import.meta.url), "utf8");
const governedManuals = fs.readFileSync(new URL("../lib/governed-manual-registration.ts", import.meta.url), "utf8");
const aircraftPublication = fs.readFileSync(new URL("../lib/aircraft-publication.ts", import.meta.url), "utf8");
const governedBootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

test("generic admin repository exposes no legacy governance bypass writers", () => {
  for (const legacy of [
    "publishAircraft",
    "registerManualRevision",
    "createDraftVersion",
    "approveContentVersion",
    "publishContentVersion",
    "bootstrapStaticContent",
  ]) {
    assert.doesNotMatch(adminRepository, new RegExp(`export\\s+async\\s+function\\s+${legacy}\\b`));
  }
  assert.doesNotMatch(adminRepository, /staticTrainingContentSeed/);
});

test("privileged state transitions live only behind the governed modules", () => {
  assert.match(actions, /createGovernedDraftVersion/);
  assert.match(actions, /approveGovernedContentVersion/);
  assert.match(actions, /publishGovernedContentVersion/);
  assert.match(actions, /registerGovernedManualRevision/);
  assert.match(actions, /publishAircraftWhenComplete/);
  assert.match(actions, /bootstrapStaticContentGoverned/);

  assert.match(governedLifecycle, /sql\.transaction/);
  assert.match(governedManuals, /sql\.transaction/);
  assert.match(aircraftPublication, /sql\.transaction/);
  assert.match(governedBootstrap, /createGovernedDraftVersion/);
});
