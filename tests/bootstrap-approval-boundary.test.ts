import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const adminPage = fs.readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
const adminAircraftSettings = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/settings/page.tsx", import.meta.url), "utf8");
const bootstrapRepository = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

test("static seed migration requires explicit authenticated administrator approval", () => {
  const actionStart = actions.indexOf("export async function bootstrapStaticAction");
  const adminCheck = actions.indexOf("requireTrainingAdmin()", actionStart);
  const confirmation = actions.indexOf('text(form,"confirmApprovedSeed")!=="yes"', actionStart);
  const bootstrap = actions.indexOf("bootstrapStaticContentGoverned(session.subject)", actionStart);
  assert.ok(actionStart >= 0 && adminCheck > actionStart && confirmation > adminCheck && bootstrap > confirmation);
  assert.match(actions, /Explicit administrator confirmation is required before the current source-backed training seed can be approved and published/);
});

test("admin UI describes the transition as approval and publication rather than a passive import", () => {
  assert.match(adminPage, /Import, approve and publish current training seed/);
  assert.match(adminPage, /name="confirmApprovedSeed" value="yes" required/);
  assert.match(adminPage, /record approval and publication under my administrator identity/);
  assert.match(adminPage, /does not satisfy controlled-manual production readiness/);
  assert.doesNotMatch(adminPage, /current v1 seed|Learjet v1 seed/);
});

test("confirmed migration records governed approval under the acting subject before publication", () => {
  const bootstrapStart = bootstrapRepository.indexOf("export async function bootstrapStaticContentGoverned");
  const approval = bootstrapRepository.indexOf("approveGovernedContentVersion(", bootstrapStart);
  const publication = bootstrapRepository.indexOf("publishGovernedContentVersion(versionId, subject)", bootstrapStart);
  assert.ok(bootstrapStart >= 0 && approval > bootstrapStart && publication > approval);
  assert.match(bootstrapRepository.slice(bootstrapStart), /Explicit migration approval of source-backed training content/);
  assert.match(bootstrapRepository.slice(bootstrapStart), /versionId,\s*subject,/s);
});

test("replacing an existing published module requires a separate explicit administrator confirmation", () => {
  const actionStart = actions.indexOf("export async function publishNativeModuleUpgradeAction");
  const adminCheck = actions.indexOf("requireTrainingAdmin()", actionStart);
  const confirmation = actions.indexOf('text(form,"confirmReviewedNativeUpgrade")!=="yes"', actionStart);
  const upgrade = actions.indexOf("publishStaticNativeModuleUpgrade(aircraftId,selectedDomain,session.subject)", actionStart);
  assert.ok(actionStart >= 0 && adminCheck > actionStart && confirmation > adminCheck && upgrade > confirmation);
  assert.match(adminAircraftSettings, /name="confirmReviewedNativeUpgrade" type="checkbox" value="yes" required/);
  assert.match(adminAircraftSettings, /new immutable version/);
  assert.match(adminAircraftSettings, /never overwrites the existing version in place/);
});
