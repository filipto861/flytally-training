import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536OperationalLimitations, learjet3536OperationalPerformance } from "../lib/learjet-pilot-takeoff-data.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const dataset = (id: string) => {
  const value = learjet3536OperationalPerformance.datasets.find((item) => item.id === id);
  assert.ok(value, `missing performance dataset ${id}`);
  return value;
};

test("operational Learjet takeoff data remains valid universal content", () => {
  assert.deepEqual(validateUniversalTrainingContentPayload("performance", learjet3536OperationalPerformance), []);
  assert.deepEqual(validateUniversalTrainingContentPayload("limitations", learjet3536OperationalLimitations), []);
});

test("FlightSafety partial-power Table 20-7 preserves exact N1 rows", () => {
  const value = dataset("fsi-partial-power-takeoff-table-20-7");
  assert.equal(value.rows.find((row) => row.inputs.oat === 80 && row.inputs.assumedTemperature === 90)?.outputs.n1, 93.2);
  assert.equal(value.rows.find((row) => row.inputs.oat === 0 && row.inputs.assumedTemperature === 100)?.outputs.n1, 83.6);
  assert.equal(value.rows.find((row) => row.inputs.oat === -40 && row.inputs.assumedTemperature === 100)?.outputs.n1, 80.0);
});

test("takeoff certification climb cues are exposed as pilot reference", () => {
  const value = dataset("fsi-takeoff-climb-segment-speeds");
  const second = value.rows.find((row) => row.inputs.segment === "Second");
  assert.deepEqual(second?.outputs, { speedBasis: "V2", minimumGradient: "2.4%" });
});

test("certified takeoff weights stay configuration-dependent", () => {
  const group = learjet3536OperationalLimitations.groups.find((item) => item.id === "certified-takeoff-weight-reference");
  assert.ok(group);
  assert.equal(group.items.find((item) => item.id === "mtow-17000")?.value, 17000);
  assert.equal(group.items.find((item) => item.id === "mtow-18300")?.value, 18300);
  assert.equal(group.items.find((item) => item.id === "ramp-delta")?.value, 250);
});
