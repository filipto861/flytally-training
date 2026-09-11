import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536FlightReadyLimitations, learjet3536FlightReadyPerformance } from "../lib/learjet-pilot-landing-data.ts";
import { getPerformanceSelectionState, performanceScalarKey } from "../lib/performance-runtime.ts";
import { validateUniversalTrainingContentPayload } from "../lib/universal-aircraft-content.ts";

const dataset = (id: string) => {
  const value = learjet3536FlightReadyPerformance.datasets.find((item) => item.id === id);
  assert.ok(value, `missing dataset ${id}`);
  return value;
};

test("flight-ready Learjet performance and limits satisfy the universal contracts", () => {
  assert.deepEqual(validateUniversalTrainingContentPayload("performance", learjet3536FlightReadyPerformance), []);
  assert.deepEqual(validateUniversalTrainingContentPayload("limitations", learjet3536FlightReadyLimitations), []);
});

test("FlightSafety landing-speed table is preserved exactly", () => {
  const speeds = dataset("fsi-approach-landing-speeds-table-20-17");
  assert.deepEqual(speeds.rows.find((row) => row.inputs.weight === 10000)?.outputs, { vref: 105, vapp: 111 });
  assert.deepEqual(speeds.rows.find((row) => row.inputs.weight === 15300)?.outputs, { vref: 129, vapp: 136 });
  assert.equal(speeds.interpolation, "none");
});

test("landing contamination factors and limits are available in FLY performance", () => {
  const factors = dataset("fsi-landing-distance-factors-table-20-16");
  assert.equal(factors.rows.find((row) => row.inputs.surface === "Wet")?.outputs.factor, 1.4);
  assert.equal(factors.rows.find((row) => row.inputs.surface === "Wet ice")?.outputs.factor, 3.9);

  const depths = dataset("fsi-landing-contaminant-depths-table-20-15");
  assert.equal(depths.rows.find((row) => row.inputs.contaminant === "Standing water")?.outputs.maximumDepth, "0.75 in / 19.1 mm");
});

test("linear source-formula datasets accept intermediate values without extrapolation", () => {
  const tod = dataset("jaydee-tod-derived-table");
  assert.equal(tod.interpolation, "linear-explicit");
  const todResult = getPerformanceSelectionState(tod, {
    altitude: performanceScalarKey(35250),
    path: performanceScalarKey("3°"),
  });
  assert.equal(todResult.status, "interpolated");
  assert.equal(todResult.resultRow?.outputs.tod, 115.75);
  assert.equal(todResult.supportingRows.length, 2);

  const glide = dataset("jaydee-three-degree-descent-vs");
  assert.equal(glide.interpolation, "linear-explicit");
  const glideResult = getPerformanceSelectionState(glide, {
    groundSpeed: performanceScalarKey(145),
  });
  assert.equal(glideResult.status, "interpolated");
  assert.equal(glideResult.resultRow?.outputs.verticalSpeed, 725);

  const outsideRange = getPerformanceSelectionState(glide, {
    groundSpeed: performanceScalarKey(375),
  });
  assert.equal(outsideRange.status, "no-match");
  assert.equal(outsideRange.resultRow, undefined);
});

test("landing certified-weight configuration remains explicit", () => {
  const group = learjet3536FlightReadyLimitations.groups.find((item) => item.id === "landing-certified-weight-reference");
  assert.ok(group);
  assert.equal(group.items.find((item) => item.id === "mlw-standard")?.value, 14300);
  assert.equal(group.items.find((item) => item.id === "mlw-aak80-3")?.value, 15300);
  assert.equal(group.items.find((item) => item.id === "approach-climb-gradient")?.value, 2.1);
});
