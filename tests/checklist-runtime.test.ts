import assert from "node:assert/strict";
import test from "node:test";

import { formatChecklistAction, normalizeUniversalChecklist } from "../lib/checklist-runtime.ts";

const content = {
  aircraftId: "generic-aircraft",
  title: "Normal checklists",
  phases: [
    { id: "takeoff", title: "Before Takeoff", sequence: 20, items: [{ id: "trim", challenge: "Trim", response: "SET", procedureId: "trim-setting", explanation: "Set the required takeoff trim.", verification: "Confirm trim indication in the takeoff range.", condition: "Before entering the runway.", notices: [{ kind: "warning", text: "Use the approved takeoff setting for the current configuration." }] }] },
    { id: "start", title: "Before Start", sequence: 10, items: [{ id: "battery", challenge: "Battery", response: "ON" }] },
  ],
} as const;

test("universal checklist runtime is aircraft-agnostic, phase ordered and retains operating detail", () => {
  const runtime = normalizeUniversalChecklist(content);
  assert.equal(runtime.aircraftId, "generic-aircraft");
  assert.deepEqual(runtime.phases.map((phase) => phase.id), ["start", "takeoff"]);
  const trim = runtime.phases[1].items[0];
  assert.equal(formatChecklistAction(trim), "Trim — SET");
  assert.equal(trim.procedureId, "trim-setting");
  assert.match(trim.verification ?? "", /takeoff range/i);
  assert.match(trim.condition ?? "", /runway/i);
  assert.equal(trim.notices?.[0]?.kind, "warning");
});
