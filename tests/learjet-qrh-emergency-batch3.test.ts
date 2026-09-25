import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch3,
  learjet35aQrhEmergencyBatch3ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-3.ts";
import { validateUniversalAbnormalEmergencyPayload } from "../lib/universal-abnormal-emergency.ts";

test("QRH.3C staged airstart batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch3ReleaseStatus, "staged-source-review");
  assert.deepEqual(validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch3), []);
  assert.deepEqual(
    learjet35aQrhEmergencyBatch3.scenarios.map((scenario) => scenario.id),
    [
      "starter-assist-airstart-fuel-computer-on",
      "windmilling-airstart-fuel-computer-on",
      "starter-assist-airstart-fuel-computer-off",
      "windmilling-airstart-fuel-computer-off",
    ],
  );
  assert.ok(
    learjet35aQrhEmergencyBatch3.scenarios.every(
      (scenario) => scenario.effectivity.kind === "all-aircraft" && scenario.effectivity.sourceText === "ALL",
    ),
  );
});

test("QRH.3T represents the E-13 Airstart Envelope as generic visual-reference geometry", () => {
  const figure = learjet35aQrhEmergencyBatch3.figures?.[0];
  assert.ok(figure);
  assert.equal(figure.id, "airstart-envelope");
  assert.equal(figure.kind, "operating-envelope");
  assert.equal(figure.geometryPolicy, "source-digitized-visual-reference");
  assert.deepEqual(figure.sources.map((item) => item.pageLabel), ["E-13"]);
  assert.deepEqual(figure.xAxis.ticks, [0, 5, 10, 15, 20, 25]);
  assert.deepEqual(figure.yAxis.ticks, [0, 5, 10, 15, 20, 25, 30]);
  assert.equal(figure.regions[0]?.label, "WINDMILL\nAIRSTART");
  assert.match(JSON.stringify(figure.notes), /Fuel computer ON starter assist airstarts/);
  assert.match(JSON.stringify(figure.notes), /Do not attempt Fuel Computer OFF airstarts above 20,000 feet/);

  for (const scenario of learjet35aQrhEmergencyBatch3.scenarios) {
    assert.deepEqual(scenario.figureIds, ["airstart-envelope"]);
    assert.equal("boundaryNote" in scenario, false);
  }
});

test("QRH.3C visual source review found no boxed memory items on E-14 through E-18", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch3);
  assert.equal(serialized.includes('"memoryItem":true'), false);
});

test("QRH.3C Fuel Computer ON procedures preserve their distinct restart paths", () => {
  const starter = learjet35aQrhEmergencyBatch3.scenarios[0];
  const windmill = learjet35aQrhEmergencyBatch3.scenarios[1];
  assert.match(JSON.stringify(starter), /Repeat STARTER-ASSIST AIRSTART \(FUEL COMPUTER ON\) procedure/);
  assert.match(JSON.stringify(starter), /Perform WINDMILLING AIRSTART \(FUEL COMPUTER ON\)/);
  assert.match(JSON.stringify(starter), /After both engines are operating/);

  assert.match(JSON.stringify(windmill), /Air Ignition — OFF @ 45% N2/);
  assert.match(JSON.stringify(windmill), /Perform ENGINE SHUTDOWN IN FLIGHT procedure/);
});

test("QRH.3C Fuel Computer OFF procedures preserve the 20,000-foot source restriction", () => {
  const starter = learjet35aQrhEmergencyBatch3.scenarios[2];
  const windmill = learjet35aQrhEmergencyBatch3.scenarios[3];
  assert.match(JSON.stringify(starter), /below 20,000 feet/);
  assert.match(JSON.stringify(windmill), /below 20,000 feet/);
  assert.match(JSON.stringify(windmill), /15% N2, 10% N1/);
});

test("QRH.3T source provenance spans E-13 through E-19 without turning the figure into computed data", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch3);
  for (const page of ["E-13", "E-14–E-15", "E-15–E-16", "E-16–E-17", "E-18–E-19"]) {
    assert.match(serialized, new RegExp(page));
  }
  assert.match(serialized, /source-digitized-visual-reference/);
  assert.doesNotMatch(serialized, /interpolation/);
  assert.doesNotMatch(serialized, /lookupTable/);
});
