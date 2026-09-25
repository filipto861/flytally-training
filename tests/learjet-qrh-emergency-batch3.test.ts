import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhEmergencyBatch3,
  learjet35aQrhEmergencyBatch3BlockedDependencies,
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

test("QRH.3C preserves the E-13 figure as an explicit blocking dependency rather than flattening it", () => {
  assert.deepEqual(learjet35aQrhEmergencyBatch3BlockedDependencies, [
    {
      id: "airstart-envelope",
      pageLabel: "E-13",
      reason:
        "Every staged airstart procedure begins by assuring the E-13 airstart envelope. The textual procedures may be reviewed independently, but this batch must not be published operationally until the graphical envelope has a source-faithful generic representation.",
    },
  ]);
  for (const scenario of learjet35aQrhEmergencyBatch3.scenarios) {
    assert.match(scenario.boundaryNote ?? "", /E-13 AIRSTART ENVELOPE/);
    assert.match(scenario.boundaryNote ?? "", /fail-closed/);
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

test("QRH.3C source provenance spans E-14 through E-19 without inventing E-13 text", () => {
  const serialized = JSON.stringify(learjet35aQrhEmergencyBatch3);
  for (const page of ["E-14–E-15", "E-15–E-16", "E-16–E-17", "E-18–E-19"]) {
    assert.match(serialized, new RegExp(page));
  }
  assert.doesNotMatch(serialized, /TURBINE SPEED \(N2\) — %/);
  assert.doesNotMatch(serialized, /ALTITUDE — 1000 FEET/);
});
