import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const adminPage = fs.readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
const bootstrapRepository = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

test("static seed migration requires explicit authenticated administrator approval", () => {
  const actionStart = actions.indexOf("export async function bootstrapStaticAction");
  const adminCheck = actions.indexOf("requireTrainingAdmin()", actionStart);
  const confirmation = actions.indexOf('text(form,"confirmApprovedSeed")!=="yes"', actionStart);
  const bootstrap = actions.indexOf("bootstrapStaticContentGoverned(session.subject)", actionStart);
  assert.ok(actionStart >= 0 && adminCheck > actionStart && confirmation > adminCheck && bootstrap > confirmation);
  assert.match(actions, /Explicit administrator confirmation is required before the static v1 seed can be approved and published/);
});

test("admin UI describes the transition as approval and publication rather than a passive import", () => {
  assert.match(adminPage, /Import, approve and publish current v1 seed/);
  assert.match(adminPage, /name="confirmApprovedSeed" value="yes" required/);
  assert.match(adminPage, /record approval and publication under my administrator identity/);
  assert.match(adminPage, /does not satisfy controlled-manual production readiness/);
});

test("confirmed migration records governed approval under the acting subject before publication", () => {
  const bootstrapStart = bootstrapRepository.indexOf("export async function bootstrapStaticContentGoverned");
  const approval = bootstrapRepository.indexOf("approveGovernedContentVersion(", bootstrapStart);
  const publication = bootstrapRepository.indexOf("publishGovernedContentVersion(versionId, subject)", bootstrapStart);
  assert.ok(bootstrapStart >= 0 && approval > bootstrapStart && publication > approval);
  assert.match(bootstrapRepository.slice(bootstrapStart), /Explicit migration approval of the existing source-backed v1 content/);
});
