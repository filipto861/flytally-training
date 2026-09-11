import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  learjet3536CompleteCoreModules,
  learjet3536CompleteProcedures,
  learjet3536CompleteSystems,
  learjet3536FlysimwareAvionics,
  learjet3536JayDeeFlows,
} from "../lib/learjet-complete-elearning.ts";
import {
  learjet3536NativeChecklists,
  learjet3536NativeLimitations,
  learjet3536NativePerformance,
} from "../lib/learjet-native-content.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const FSI = "fsi-learjet-35-36-ptm-r1-1";
const FLYSIMWARE = "flysimware-learjet-35a-msfs-v1-2";
const JAYDEE = "jaydee-learjet-35a-checklist-v1-35-wip1";

function manualIds(value: unknown): string[] {
  const ids: string[] = [];
  function visit(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "manualId" && typeof child === "string") ids.push(child);
      else visit(child);
    }
  }
  visit(value);
  return ids;
}

test("M24 universal Learjet modules satisfy their published contracts", () => {
  for (const module of learjet3536CompleteCoreModules) {
    assert.deepEqual(
      validateUniversalTrainingContentPayload(module.domain, module.payload),
      [],
      `${module.domain} must satisfy the universal content contract`,
    );
  }
});

test("real-standard Learjet modules do not silently cite simulator workflow sources", () => {
  for (const module of [
    learjet3536NativeChecklists,
    learjet3536CompleteProcedures,
    learjet3536NativePerformance,
    learjet3536NativeLimitations,
    learjet3536CompleteSystems,
  ]) {
    const ids = manualIds(module);
    assert.ok(ids.length > 0);
    assert.ok(ids.every((id) => id === FSI), `real-standard module unexpectedly cites ${[...new Set(ids.filter((id) => id !== FSI))].join(", ")}`);
  }
});

test("JayDee checklist is retained only as a visibly simulator-workflow flow module", () => {
  assert.ok(learjet3536JayDeeFlows.flows.length >= 9);
  assert.match(learjet3536JayDeeFlows.disclaimer ?? "", /Simulator workflow reference only/);
  assert.ok(manualIds(learjet3536JayDeeFlows).every((id) => id === JAYDEE));
  for (const flow of learjet3536JayDeeFlows.flows) {
    assert.ok(flow.sources?.length);
    for (const step of flow.steps) assert.ok(step.sources?.length, `${flow.id}/${step.id} must retain source provenance`);
  }
});

test("Flysimware material remains an implementation supplement rather than real-aircraft authority", () => {
  assert.ok(learjet3536FlysimwareAvionics.topics.length >= 9);
  assert.match(learjet3536FlysimwareAvionics.disclaimer ?? "", /Simulator implementation reference only/);
  assert.ok(manualIds(learjet3536FlysimwareAvionics).every((id) => id === FLYSIMWARE));
});

test("FlightSafety course depth covers the broad aircraft syllabus without forcing APU applicability", () => {
  const ids = new Set(learjet3536CompleteSystems.systems.map((system) => system.id));
  for (const required of [
    "aircraft-general",
    "electrical",
    "lighting",
    "master-warning",
    "fuel",
    "powerplant",
    "fire-protection",
    "pneumatics",
    "anti-ice",
    "air-conditioning",
    "pressurization",
    "hydraulics",
    "landing-gear-brakes",
    "flight-controls",
    "avionics-airdata-autoflight",
    "miscellaneous-systems",
    "weight-balance",
    "crm",
  ]) assert.ok(ids.has(required), `missing system lesson ${required}`);
  assert.ok(!ids.has("apu"), "APU must not be invented without confirmed applicability/content");
});

test("M24 avionics learner route is generic and exposes source authority", () => {
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/avionics/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /learjet-35-36/i);
  assert.match(page, /filterAvionicsForConfiguration/);
  assert.match(page, /sourceAuthorityLabel/);
  assert.match(page, /kind="avionics"/);
});
