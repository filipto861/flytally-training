import assert from "node:assert/strict";
import test from "node:test";
import { validateContentPayload } from "../lib/content-contracts.ts";

const aircraftId = "contract-test-aircraft";

test("publication contract rejects a wrong aircraft id and malformed legacy payload", () => {
  const errors = validateContentPayload("normal-flight", { aircraftId: "wrong", title: "x", estimatedMinutes: 10, sourceNote: "x", phases: [] }, aircraftId);
  assert.ok(errors.some((error) => error.includes("aircraftId")));
  assert.ok(errors.some((error) => error.includes("phases")));
});

test("independent checklist, procedure and performance modules validate without aircraft-specific code", () => {
  assert.deepEqual(validateContentPayload("checklists", {
    aircraftId,
    title: "Normal checklists",
    phases: [{ id: "before-start", title: "Before Start", sequence: 10, items: [{ id: "battery", challenge: "Battery", response: "ON", procedureId: "electrical-power-up", explanation: "Establish aircraft electrical power." }] }],
  }, aircraftId), []);

  assert.deepEqual(validateContentPayload("procedures", {
    aircraftId,
    title: "Normal procedures",
    procedures: [{ id: "electrical-power-up", title: "Electrical power up", steps: [{ id: "battery-on", action: "Set BAT switch ON", expectedResult: "Bus voltage indicated", verification: "Confirm normal voltage indication", rationale: "Energizes the aircraft electrical system." }] }],
  }, aircraftId), []);

  assert.deepEqual(validateContentPayload("performance", {
    aircraftId,
    title: "Performance",
    datasets: [{
      id: "takeoff-speed",
      title: "Takeoff speed",
      kind: "lookup-table",
      interpolation: "none",
      axes: [{ key: "mass", label: "Mass", unit: "kg", values: [600] }],
      outputs: [{ key: "vr", label: "VR", unit: "KIAS" }],
      rows: [{ inputs: { mass: 600 }, outputs: { vr: 60 } }],
    }],
  }, aircraftId), []);
});


test("procedure contract rejects unsupported step-level applicability instead of silently ignoring it", () => {
  const errors = validateContentPayload("procedures", {
    aircraftId,
    title: "Scoped step",
    procedures: [{
      id: "scoped",
      title: "Scoped",
      steps: [{
        id: "step",
        action: "Action",
        applicability: { equipmentAllOf: ["option-x"] },
      }],
    }],
  }, aircraftId);

  assert.ok(errors.some((error) => error.includes("steps[0].applicability") && error.includes("not supported")));
});


test("universal sourcePolicy accepts the two governed values and rejects unknown policy strings", () => {
  for (const sourcePolicy of ["faa-approved", "available-sources"] as const) {
    assert.deepEqual(validateContentPayload("procedures", {
      aircraftId,
      title: "Policy procedures",
      sourcePolicy,
      procedures: [{
        id: "policy-procedure",
        title: "Policy procedure",
        steps: [{ id: "step", action: "Action" }],
      }],
    }, aircraftId), []);
  }

  const errors = validateContentPayload("procedures", {
    aircraftId,
    title: "Bad policy",
    sourcePolicy: "anything-goes",
    procedures: [{
      id: "policy-procedure",
      title: "Policy procedure",
      steps: [{ id: "step", action: "Action" }],
    }],
  }, aircraftId);

  assert.ok(errors.some((error) => error.includes("sourcePolicy")));
});
