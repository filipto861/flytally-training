import assert from "node:assert/strict";
import test from "node:test";

import { formatChecklistAction, normalizeUniversalChecklist } from "../lib/checklist-runtime.ts";

const content = {
  aircraftId: "generic-aircraft",
  title: "Normal checklists",
  phases: [
    { id: "takeoff", title: "Before Takeoff", sequence: 20, items: [{ id: "trim", challenge: "Trim", response: "SET", procedureId: "trim-setting", explanation: "Set the required takeoff trim.", verification: "Confirm trim indication in the takeoff range." }] },
    { id: "start", title: "Before Start", sequence: 10, items: [{ id: "battery", challenge: "Battery", response: "ON" }] },
  ],
} as const;

test("universal checklist runtime is aircraft-agnostic and phase ordered", () => {
  const runtime = normalizeUniversalChecklist(content);
  assert.equal(runtime.aircraftId, "generic-aircraft");
  assert.deepEqual(runtime.phases.map((phase) => phase.id), ["start", "takeoff"]);
  assert.equal(formatChecklistAction(runtime.phases[1].items[0]), "Trim — SET");
  assert.equal(runtime.phases[1].items[0].procedureId, "trim-setting");
  assert.match(runtime.phases[1].items[0].verification ?? "", /takeoff range/i);
});
