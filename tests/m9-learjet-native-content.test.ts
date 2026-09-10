import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import {
  learjet3536NativeChecklists,
  learjet3536NativeLimitations,
  learjet3536NativeModules,
  learjet3536NativePerformance,
  learjet3536NativeProcedures,
  learjet3536NativeSystems,
} from "../lib/learjet-native-content.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";
import type { AircraftChecklistContent } from "../lib/universal-aircraft-content.ts";

const aircraftId = "learjet-35-36";
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

test("Learjet native M9 modules satisfy the universal governed contracts", () => {
  const modules = [
    ["checklists", learjet3536NativeChecklists],
    ["procedures", learjet3536NativeProcedures],
    ["performance", learjet3536NativePerformance],
    ["limitations", learjet3536NativeLimitations],
    ["systems", learjet3536NativeSystems],
  ] as const;

  for (const [domain, payload] of modules) {
    assert.deepEqual(validateContentPayload(domain, payload, aircraftId), [], `${domain} must validate`);
    assert.match(payload.disclaimer ?? "", /AFM/i);
    assert.match(payload.sourceNote ?? "", /FlightSafety/i);
  }
  assert.deepEqual(learjet3536NativeModules.map(module => module.domain), ["checklists", "procedures", "performance", "limitations", "systems"]);
});

test("native Learjet checklist item provenance is retained and every procedure link resolves", () => {
  const procedureIds = new Set(learjet3536NativeProcedures.procedures.map(procedure => procedure.id));
  const ids = new Set<string>();
  for (const phase of learjet3536NativeChecklists.phases) {
    for (const item of phase.items) {
      assert.ok(!ids.has(item.id), `duplicate checklist item id ${item.id}`);
      ids.add(item.id);
      assert.ok(item.sources?.length, `${phase.id}/${item.id} must retain item-level source provenance`);
      assert.ok(item.sources?.every(source => source.manualId === "fsi-learjet-35-36-ptm-r1-1"));
      if (item.procedureId) assert.ok(procedureIds.has(item.procedureId), `${item.procedureId} must resolve to a native procedure`);
    }
  }
  assert.equal(learjet3536NativeChecklists.phases[0]?.id, "power-up");
  assert.equal(learjet3536NativeChecklists.phases.at(-1)?.id, "shutdown");
});

test("native performance and limitations preserve configuration differences rather than flattening one Learjet", () => {
  const takeoff = learjet3536NativePerformance.datasets.find(dataset => dataset.id === "certified-takeoff-weight");
  assert.ok(takeoff);
  const weights = new Set(takeoff.rows.map(row => row.outputs.maxTakeoffWeight));
  assert.deepEqual(weights, new Set([17000, 18000, 18300]));
  assert.equal(takeoff.interpolation, "none");

  const landing = learjet3536NativeLimitations.groups.find(group => group.id === "landing-weight");
  assert.ok(landing?.items.some(item => item.value === 14300));
  assert.ok(landing?.items.some(item => item.value === 15300));
  assert.ok(landing?.items.some(item => item.notices?.some(notice => notice.kind === "warning")));
});

test("static repository serves native universal modules before legacy migration adapters", async () => {
  const repository = new StaticTrainingContentRepository();
  const domains = await repository.listPublishedModuleDomains(aircraftId);
  for (const domain of ["checklists", "procedures", "performance", "limitations", "systems"] as const) assert.ok(domains.includes(domain));
  const checklist = await repository.getPublishedModule<AircraftChecklistContent>(aircraftId, "checklists");
  assert.equal(checklist?.title, learjet3536NativeChecklists.title);
  assert.match(checklist?.sourceNote ?? "", /Native M9/i);
});

test("governed static bootstrap publishes universal modules through one generic loop", () => {
  assert.match(bootstrap, /staticTrainingContentSeed\.universalModules/);
  assert.match(bootstrap, /bootstrapContentRecords\(\)/);
  assert.match(bootstrap, /domain: module\.domain/);
  assert.match(bootstrap, /payload: module\.payload/);
  assert.doesNotMatch(bootstrap, /domain === "checklists"|domain === "performance"|learjet-35-36/);
});
