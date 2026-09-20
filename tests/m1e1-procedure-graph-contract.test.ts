import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesAircraftApplicability,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import {
  containsProcedureGraphPayload,
  validateProcedureGraph,
} from "../lib/procedure-graph.ts";
import {
  validateUniversalTrainingContentPayload,
  type AircraftGraphProcedure,
} from "../lib/universal-aircraft-content.ts";

const source = [{
  manualId: "zr-lite-afms-204l-5780",
  section: "III",
  pageLabel: "3-1",
}] as const;

const procedure = {
  id: "engine-failure-during-takeoff",
  title: "Engine Failure — During Takeoff",
  phase: "Takeoff",
  applicability: {
    baseVariants: ["35", "35a", "36", "36a"],
    modificationsAllOf: ["zr-lite"],
  },
  graph: {
    version: 1,
    entryNodeId: "takeoff-speed-decision",
    nodes: [
      {
        id: "takeoff-speed-decision",
        kind: "decision",
        prompt: "Was the engine failure below or above V1 speed?",
        options: [
          { id: "below-v1", label: "Below V1 speed", targetNodeId: "below-thrust-idle" },
          { id: "above-v1", label: "Above V1 speed", targetNodeId: "above-directional-note" },
        ],
        sources: source,
      },

      { id: "below-thrust-idle", kind: "action", action: "Thrust Levers — IDLE.", memoryItem: true, nextNodeId: "below-wheel-brakes", sources: source },
      { id: "below-wheel-brakes", kind: "action", action: "Wheel Brakes — APPLY.", memoryItem: true, nextNodeId: "below-spoilers", sources: source },
      { id: "below-spoilers", kind: "action", action: "Spoilers — EXT.", memoryItem: true, nextNodeId: "below-drag-device", sources: source },
      {
        id: "below-drag-device",
        kind: "action",
        action: "Drag Chute or Thrust Reversers — Deploy, if necessary.",
        conditionText: "If installed.",
        memoryItem: true,
        nextNodeId: "below-end",
        sources: source,
      },
      { id: "below-end", kind: "end", label: "Below V1 branch complete", sources: source },

      {
        id: "above-directional-note",
        kind: "note",
        text: "Directional Control is improved if the nose wheel is kept on the runway until VR.",
        nextNodeId: "above-directional-control",
        sources: source,
      },
      {
        id: "above-directional-control",
        kind: "action",
        action: "Rudder and Ailerons — As required, for directional control.",
        memoryItem: true,
        nextNodeId: "above-accelerate-vr",
        sources: source,
      },
      { id: "above-accelerate-vr", kind: "action", action: "Accelerate to VR.", memoryItem: true, nextNodeId: "above-rotate-v2", sources: source },
      { id: "above-rotate-v2", kind: "action", action: "Rotate at VR; Climb at V2.", memoryItem: true, nextNodeId: "above-gear-up", sources: source },
      {
        id: "above-gear-up",
        kind: "action",
        action: "GEAR — UP, when positive rate of climb is established.",
        memoryItem: true,
        nextNodeId: "above-accelerate-flaps",
        sources: source,
      },
      {
        id: "above-accelerate-flaps",
        kind: "action",
        action: "When clear of obstacles, accelerate to V2 + 35 and then retract flaps.",
        memoryItem: true,
        nextNodeId: "above-fuel-jettison",
        sources: source,
      },
      {
        id: "above-fuel-jettison",
        kind: "action",
        action: "FUEL JTSN Switch — ON (lights on); Off prior to touchdown.",
        memoryItem: true,
        nextNodeId: "above-tip-tank-note",
        sources: source,
      },
      {
        id: "above-tip-tank-note",
        kind: "note",
        text: "Lateral control is improved with tip tanks empty. If time permits, it is recommended that tip tank fuel be jettisoned.",
        nextNodeId: "above-shutdown-reference",
        sources: source,
      },
      {
        id: "above-shutdown-reference",
        kind: "reference",
        instruction: "Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Section IV of the basic AFM, or ENGINE FIRE — SHUTDOWN procedure, Section 3 of the basic AFM.",
        targets: [
          { title: "ENGINE SHUTDOWN IN FLIGHT", sourceLocationText: "Section IV of the basic AFM" },
          { title: "ENGINE FIRE — SHUTDOWN", sourceLocationText: "Section 3 of the basic AFM" },
        ],
        memoryItem: true,
        nextNodeId: "above-end",
        sources: source,
      },
      { id: "above-end", kind: "end", label: "Above V1 branch complete", sources: source },
    ],
  },
  sources: source,
} as const satisfies AircraftGraphProcedure;

const fixture = {
  aircraftId: "graph-contract-aircraft",
  title: "Emergency procedures",
  procedures: [procedure],
} as const;

function cloneFixture(): any {
  return structuredClone(fixture);
}

test("M1-E1 real branching fixture passes the universal procedures parser", () => {
  assert.deepEqual(
    validateUniversalTrainingContentPayload("procedures", fixture),
    [],
  );
});

test("M1-E1 pure graph validator is deterministic and returns structured errors/warnings", () => {
  const first = validateProcedureGraph(procedure.graph);
  const second = validateProcedureGraph(procedure.graph);
  assert.deepEqual(first, { errors: [], warnings: [] });
  assert.deepEqual(second, first);
});

test("M1-E1 graph keeps memory items and conditional source qualifiers machine-readable", () => {
  const executable = procedure.graph.nodes.filter((node) => node.kind === "action" || node.kind === "reference");
  assert.ok(executable.length > 0);
  assert.ok(executable.every((node) => node.memoryItem === true));

  const conditional = procedure.graph.nodes.find((node) => node.id === "below-drag-device");
  assert.equal(conditional?.kind, "action");
  if (conditional?.kind === "action") assert.equal(conditional.conditionText, "If installed.");

  const reference = procedure.graph.nodes.find((node) => node.id === "above-shutdown-reference");
  assert.equal(reference?.kind, "reference");
  if (reference?.kind === "reference") assert.equal(reference.targets.length, 2);
});

test("M1-E1 procedure-level applicability uses the existing M1-D matcher unchanged", () => {
  const matching: AircraftConfiguration = {
    variant: "configured",
    baseVariant: "35a",
    equipment: new Set(),
    modifications: new Map([["zr-lite", "installed"]]),
  };
  const nonMatching: AircraftConfiguration = {
    ...matching,
    modifications: new Map([["zr-lite", "not-installed"]]),
  };

  assert.equal(matchesAircraftApplicability(procedure.applicability, matching), true);
  assert.equal(matchesAircraftApplicability(procedure.applicability, nonMatching), false);
});

test("M1-E1 rejects duplicate node ids, missing entry/targets, unreachable nodes and cycles", () => {
  const duplicate = cloneFixture().procedures[0].graph;
  duplicate.nodes.push({ id: "below-end", kind: "end" });
  assert.match(validateProcedureGraph(duplicate).errors.join("\n"), /duplicate id "below-end"/i);

  const missingEntry = cloneFixture().procedures[0].graph;
  missingEntry.entryNodeId = "missing";
  assert.match(validateProcedureGraph(missingEntry).errors.join("\n"), /entryNodeId references missing node "missing"/i);

  const missingTarget = cloneFixture().procedures[0].graph;
  missingTarget.nodes.find((node: any) => node.id === "below-thrust-idle").nextNodeId = "missing-target";
  assert.match(validateProcedureGraph(missingTarget).errors.join("\n"), /references missing target "missing-target"/i);

  const unreachable = cloneFixture().procedures[0].graph;
  unreachable.nodes.push({ id: "orphan-end", kind: "end" });
  assert.match(validateProcedureGraph(unreachable).errors.join("\n"), /node "orphan-end" is unreachable/i);

  const cycle = cloneFixture().procedures[0].graph;
  cycle.nodes.find((node: any) => node.id === "below-drag-device").nextNodeId = "below-thrust-idle";
  assert.match(validateProcedureGraph(cycle).errors.join("\n"), /contains a cycle/i);
});

test("M1-E1 decisions require explicit choices and never receive an implicit fallback", () => {
  const graph = cloneFixture().procedures[0].graph;
  graph.nodes.find((node: any) => node.id === "takeoff-speed-decision").options = [
    { id: "only", label: "Only option", targetNodeId: "below-thrust-idle" },
  ];
  assert.match(validateProcedureGraph(graph).errors.join("\n"), /at least two explicit user choices/i);
});

test("M1-E1 rejects step/node applicability until a real node-level use case is implemented", () => {
  const graphFixture = cloneFixture();
  graphFixture.procedures[0].graph.nodes.find((node: any) => node.id === "below-thrust-idle").applicability = {
    equipmentAllOf: ["option-x"],
  };
  assert.match(
    validateUniversalTrainingContentPayload("procedures", graphFixture).join("\n"),
    /nodes\[1\]\.applicability.*not supported/i,
  );

  const linearFixture = {
    aircraftId: "linear-aircraft",
    title: "Linear",
    procedures: [{
      id: "linear",
      title: "Linear",
      steps: [{ id: "step", action: "Action", applicability: { equipmentAllOf: ["option-x"] } }],
    }],
  };
  assert.match(
    validateUniversalTrainingContentPayload("procedures", linearFixture).join("\n"),
    /steps\[0\]\.applicability.*not supported/i,
  );
});

test("M1-E1 procedure definitions must choose exactly one authoritative execution model", () => {
  const both = cloneFixture();
  both.procedures[0].steps = [{ id: "legacy", action: "Legacy" }];
  assert.match(
    validateUniversalTrainingContentPayload("procedures", both).join("\n"),
    /exactly one execution model: steps or graph/i,
  );
});

test("M1-E1 detects graph payloads independently of learner runtime support", () => {
  assert.equal(containsProcedureGraphPayload(fixture), true);
  assert.equal(containsProcedureGraphPayload({
    aircraftId: "linear",
    title: "Linear",
    procedures: [{ id: "linear", title: "Linear", steps: [{ id: "a", action: "A" }] }],
  }), false);
});
