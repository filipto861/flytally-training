import assert from "node:assert/strict";
import test from "node:test";

import { filterSystems, systemSearchText } from "../lib/systems-runtime.ts";
import type { AircraftSystemLesson } from "../lib/universal-aircraft-content.ts";

const systems: readonly AircraftSystemLesson[] = [
  {
    id: "electrical",
    title: "Electrical",
    summary: "DC power generation and distribution.",
    controls: ["Battery switch", "Generator switch"],
    indications: ["Bus voltage"],
    normalOperation: ["Generators supply the buses in normal operation."],
    abnormalCues: ["Low bus voltage"],
  },
  {
    id: "fuel",
    title: "Fuel",
    summary: "Fuel storage and delivery.",
    components: ["Wing tanks", "Boost pump"],
    controls: ["Fuel selector"],
    remember: ["Confirm the selected source before start."],
  },
];

test("systems search text includes operational details, not only the title", () => {
  assert.match(systemSearchText(systems[0]), /low bus voltage/);
  assert.match(systemSearchText(systems[1]), /boost pump/);
});

test("systems filtering stays generic across controls, indications and memory items", () => {
  assert.deepEqual(filterSystems(systems, { query: "generator switch" }).map((system) => system.id), ["electrical"]);
  assert.deepEqual(filterSystems(systems, { query: "fuel selector" }).map((system) => system.id), ["fuel"]);
  assert.deepEqual(filterSystems(systems, { query: "selected source" }).map((system) => system.id), ["fuel"]);
});

test("empty systems search preserves source order", () => {
  assert.deepEqual(filterSystems(systems, {}).map((system) => system.id), ["electrical", "fuel"]);
});
