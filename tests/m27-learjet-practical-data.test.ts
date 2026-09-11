import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536PracticalLimitations, learjet3536PracticalPerformance } from "../lib/learjet-pilot-data-practical.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const dataset = (id: string) => {
  const value = learjet3536PracticalPerformance.datasets.find((item) => item.id === id);
  assert.ok(value, `missing performance dataset ${id}`);
  return value;
};

test("M27 practical performance remains valid universal content", () => {
  assert.deepEqual(validateUniversalTrainingContentPayload("performance", learjet3536PracticalPerformance), []);
  assert.deepEqual(validateUniversalTrainingContentPayload("limitations", learjet3536PracticalLimitations), []);
});

test("FlightSafety descent table includes the recovered FL360 row", () => {
  const value = dataset("fsi-descent-performance-table-20-11-complete");
  const row = value.rows.find((item) => item.inputs.altitude === 36);
  assert.deepEqual(row?.outputs, {
    minFuelTime: 11.5,
    minFuelDistance: 69,
    minFuel: 129,
    normalTime: 13.4,
    normalDistance: 86,
    normalFuel: 246,
  });
});

test("wet and contaminated takeoff reference preserves source factors", () => {
  const factors = dataset("fsi-takeoff-distance-factors-table-20-6");
  assert.equal(factors.rows.find((item) => item.inputs.weight === 10000)?.outputs.wetIce, 3.3);
  assert.equal(factors.rows.find((item) => item.inputs.weight === 17000)?.outputs.wetIce, 2.1);

  const depths = dataset("fsi-takeoff-contaminant-depths-table-20-5");
  const standingWater = depths.rows.find((item) => item.inputs.contaminant === "Standing water" && item.inputs.classification === "Heavy");
  assert.equal(standingWater?.outputs.depthMm, 6);
});

test("source formula materializations return practical cockpit values", () => {
  const tod = dataset("jaydee-tod-derived-table");
  assert.equal(tod.rows.find((item) => item.inputs.altitude === 35000 && item.inputs.path === "3°")?.outputs.tod, 115);

  const glide = dataset("jaydee-three-degree-descent-vs");
  assert.equal(glide.rows.find((item) => item.inputs.groundSpeed === 140)?.outputs.verticalSpeed, 700);

  const cruise = dataset("fsi-cruise-fuel-per-100nm-derived");
  assert.equal(cruise.rows.find((item) => item.inputs.groundSpeed === 400 && item.inputs.fuelFlow === 1200)?.outputs.fuelPer100Nm, 300);
});

test("pilot quick reference includes walkaround and fuel-serviceability data", () => {
  const walkaround = learjet3536PracticalLimitations.groups.find((group) => group.id === "walkaround-measurable-reference");
  assert.ok(walkaround);
  assert.equal(walkaround.items.find((item) => item.id === "nose-strut")?.value, "2.5–3.5 in");
  assert.equal(walkaround.items.find((item) => item.id === "main-tire-18300")?.value, "161–171 PSI");

  const fuel = learjet3536PracticalLimitations.groups.find((group) => group.id === "fuel-capacity-operational-reference");
  assert.ok(fuel);
  assert.equal(fuel.items.find((item) => item.id === "fuel-fuselage-35")?.value, 1340);
  assert.equal(fuel.items.find((item) => item.id === "fuel-pressure-annun")?.value, "below 0.25 PSIG");
});
