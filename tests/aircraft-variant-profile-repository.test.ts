import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository = fs.readFileSync(new URL("../lib/postgres-content-repository.ts", import.meta.url), "utf8");
const selector = fs.readFileSync(new URL("../components/aircraft-variant-selector.tsx", import.meta.url), "utf8");
const applicability = fs.readFileSync(new URL("../lib/aircraft-applicability.ts", import.meta.url), "utf8");
const adminRepository = fs.readFileSync(new URL("../lib/content-admin-repository.ts", import.meta.url), "utf8");
const catalog = fs.readFileSync(new URL("../lib/aircraft-catalog.ts", import.meta.url), "utf8");
const settings = fs.readFileSync(new URL("../app/admin/aircraft/[aircraftId]/settings/page.tsx", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

const configuredPages = [
  "checklists",
  "procedures",
  "performance",
  "limitations",
  "systems",
  "knowledge",
  "flows",
].map((section) => fs.readFileSync(new URL(`../app/aircraft/[aircraftId]/${section}/page.tsx`, import.meta.url), "utf8"));

test("PostgreSQL learner repository hydrates display name and equipment tags from variant metadata", () => {
  assert.match(repository, /v\.display_name,v\.metadata/);
  assert.match(repository, /equipmentTags:stringArray\(metadata\.equipmentTags\)/);
  assert.match(repository, /variantProfiles/);
  assert.match(repository, /variants:variantProfiles\.map\(profile=>profile\.key\)/);
});

test("configuration runtime never infers equipment from a variant key", () => {
  assert.match(applicability, /mergeAircraftEquipmentTags\(aircraft\.equipmentTags, profile\?\.equipmentTags\)/);
  assert.match(applicability, /Falling back to an[\s\S]*empty equipment set/);
  assert.doesNotMatch(applicability, /35A|36A|AAK|ECR|Learjet/i);
});

test("all native learner modules resolve applicability through the aircraft profile", () => {
  for (const page of configuredPages) {
    assert.match(page, /configurationForAircraftVariant\(aircraft, selectedVariant\)/);
    assert.match(page, /variantProfiles=\{aircraft\.variantProfiles\}/);
  }
});

test("compact variant selector uses profile display data without exposing an aircraft-specific option list", () => {
  assert.match(selector, /variantProfiles/);
  assert.match(selector, /profile\.displayName/);
  assert.match(selector, /profiles\.map/);
  assert.match(selector, />Variant<\/span>/);
  assert.match(selector, /Common \/ all/);
  assert.doesNotMatch(selector, /equipment\/modification tag|Variant-specific content is active/);
  assert.doesNotMatch(selector, /35A|36A|Bristell|Boeing|Learjet/i);
});

test("structured variant configuration is hydrated through learner and admin profile paths", () => {
  assert.match(
    catalog,
    /configuration\?:\s*AircraftConfigurationMetadata/,
  );
  assert.match(
    repository,
    /parseAircraftConfigurationMetadata\(metadata\.configuration\)/,
  );
  assert.match(
    adminRepository,
    /parseAircraftConfigurationMetadata\(metadata\.configuration\)/,
  );
});

test("Studio round-trips structured configuration through the governed variant action", () => {
  assert.match(settings, /name="configurationJson"/);
  assert.match(settings, /profile\.configuration/);
  assert.match(actions, /variantConfiguration\(form\)/);
  assert.match(actions, /parseAircraftConfigurationMetadata/);
});
