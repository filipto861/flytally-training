import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const genericLearnerRuntime = [
  read("app/aircraft/[aircraftId]/page.tsx"),
  read("app/aircraft/[aircraftId]/[section]/page.tsx"),
  read("app/aircraft/[aircraftId]/fly/page.tsx"),
  read("app/aircraft/[aircraftId]/performance/page.tsx"),
  read("components/aircraft-workspace-nav.tsx"),
  read("components/flight-deck.tsx"),
  read("components/operational-performance.tsx"),
  read("components/performance-calculator.tsx"),
  read("lib/aircraft-workspace-navigation.ts"),
  read("lib/content-repository.ts"),
  read("lib/postgres-content-repository.ts"),
  read("lib/aircraft-applicability.ts"),
].join("\n");

test("v3.1 M1 keeps learner runtime free of named-aircraft branches", () => {
  assert.doesNotMatch(
    genericLearnerRuntime,
    /\b(?:learjet|bristell|cessna|boeing|bombardier|rotax)\b/i,
  );
});

test("v3.1 M1 keeps aircraft identity out of the generic performance engine", () => {
  const calculator = read("lib/performance-calculator.ts");
  const runtime = read("lib/performance-runtime.ts");
  assert.doesNotMatch(calculator + runtime, /\baircraftId\b|\bmanufacturer\b|\bmodel\b/i);
  assert.doesNotMatch(calculator + runtime, /\b(?:learjet|bristell|cessna|boeing|bombardier|rotax)\b/i);
});

test("v3.1 M1 preserves database-governed aircraft registration", () => {
  const catalog = read("lib/aircraft-catalog.ts");
  assert.match(catalog, /export const trainingAircraft:\s*readonly TrainingAircraft\[\]\s*=\s*\[\]/);
  assert.match(catalog, /Aircraft are onboarded through[\s\S]*governed database workflow/i);
});

test("v3.1 M1 preserves aircraft-scoped persisted progress", () => {
  const progress = read("lib/progress-repository.ts");
  assert.match(progress, /WHERE account_subject=\$\{accountSubject\} AND aircraft_id=\$\{aircraftId\}/);
  assert.match(progress, /getAircraftState\(accountSubject: string, aircraftId: string\)/);
});

test("v3.1 M1 records the known semantic calculator debt instead of hiding it", () => {
  const audit = read("V31_M1_MULTI_AIRCRAFT_ARCHITECTURE_AUDIT.md");
  assert.match(audit, /P0 — performance semantics are still encoded in application code/);
  assert.match(audit, /No performance operation may depend on magic axis\/output names/i);
  assert.match(audit, /Existing Learjet behaviour must be reproduced by data declarations/i);
});
