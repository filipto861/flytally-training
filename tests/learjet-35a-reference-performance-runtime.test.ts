import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aReferencePerformancePackage } from "../aircraft-data/learjet-35a/reference-performance/package.ts";
import {
  configurationForVariant,
  filterPerformanceForConfiguration,
} from "../lib/aircraft-applicability.ts";
import { getBundledReferencePerformancePackage } from "../lib/bundled-reference-performance-content.ts";
import {
  getPerformanceSelectionState,
  performanceScalarKey,
} from "../lib/performance-runtime.ts";
import type {
  AircraftPerformanceContent,
  PerformanceDataset,
} from "../lib/universal-aircraft-content.ts";

function dataset(
  content: AircraftPerformanceContent,
  id: string,
): PerformanceDataset {
  const found = content.datasets.find((candidate) => candidate.id === id);
  assert.ok(found, `missing reference dataset ${id}`);
  return found;
}

function filters(
  weightLb: number,
  pressureAltitudeFt: number,
  isaDeviationC: number,
) {
  return {
    weightLb: performanceScalarKey(weightLb),
    pressureAltitudeFt: performanceScalarKey(pressureAltitudeFt),
    isaDeviationC: performanceScalarKey(isaDeviationC),
  };
}

test("15.2c Reference performance is registered separately from Takeoff/Landing Performance", () => {
  assert.equal(
    getBundledReferencePerformancePackage("learjet-35a"),
    learjet35aReferencePerformancePackage,
  );

  const operationalRegistry = fs.readFileSync(
    new URL("../lib/bundled-performance-content.ts", import.meta.url),
    "utf8",
  );
  const operationalPackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(operationalRegistry, /ReferencePerformance/);
  assert.doesNotMatch(operationalPackage, /reference-performance/);
  assert.equal(
    learjet35aReferencePerformancePackage.content.datasets.every(
      (item) => item.phase === "reference",
    ),
    true,
  );
});

test("15.2c Rosemount applicability selects exactly one cruise family per regime", () => {
  const withRosemount = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("fc530-standard", ["rosemount-pitot-static"]),
  );
  const withoutRosemount = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("legacy", []),
  );

  assert.deepEqual(
    withRosemount.datasets.map((item) => item.id),
    [
      "reference-climb-two-engine",
      "reference-lrc-two-engine-with-rosemount",
      "reference-normal-cruise-with-rosemount",
      "reference-lrc-one-engine-with-rosemount",
    ],
  );
  assert.deepEqual(
    withoutRosemount.datasets.map((item) => item.id),
    [
      "reference-climb-two-engine",
      "reference-lrc-two-engine-without-rosemount",
      "reference-normal-cruise-without-rosemount",
      "reference-lrc-one-engine-without-rosemount",
    ],
  );
});

test("15.2c climb returns exact source data and bounded trilinear interpolation", () => {
  const climb = dataset(
    learjet35aReferencePerformancePackage.content,
    "reference-climb-two-engine",
  );

  const exact = getPerformanceSelectionState(
    climb,
    filters(18300, 41000, -10),
  );
  assert.equal(exact.status, "exact");
  assert.deepEqual(exact.resultRow?.outputs, {
    timeMin: 16.5,
    distanceNm: 98,
    fuelLb: 570.9,
  });

  const low = getPerformanceSelectionState(
    climb,
    filters(18000, 35000, 0),
  );
  const high = getPerformanceSelectionState(
    climb,
    filters(18300, 35000, 0),
  );
  const midpoint = getPerformanceSelectionState(
    climb,
    filters(18150, 35000, 0),
  );

  assert.equal(low.status, "exact");
  assert.equal(high.status, "exact");
  assert.equal(midpoint.status, "interpolated");
  for (const key of ["timeMin", "distanceNm", "fuelLb"] as const) {
    const expected =
      ((low.resultRow?.outputs[key] as number)
      + (high.resultRow?.outputs[key] as number)) / 2;
    assert.equal(midpoint.resultRow?.outputs[key], expected);
  }
});

test("15.2c never extrapolates and sparse climb regions stay unavailable", () => {
  const climb = dataset(
    learjet35aReferencePerformancePackage.content,
    "reference-climb-two-engine",
  );

  assert.equal(
    getPerformanceSelectionState(climb, filters(19000, 35000, 0)).status,
    "no-match",
  );
  assert.equal(
    getPerformanceSelectionState(climb, filters(18300, 45000, -10)).status,
    "no-match",
  );
});

test("15.2c two-engine LRC preserves source outputs without inventing optimum cruise", () => {
  const configured = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("fc530-standard", ["rosemount-pitot-static"]),
  );
  const lrc = dataset(
    configured,
    "reference-lrc-two-engine-with-rosemount",
  );

  const exact = getPerformanceSelectionState(
    lrc,
    filters(14000, 45000, -10),
  );
  assert.equal(exact.status, "exact");
  assert.deepEqual(exact.resultRow?.outputs, {
    machInd: 0.759,
    ktas: 424,
    specificRangeNmPerLb: 0.453,
  });

  assert.equal(
    lrc.outputs.some((output) => /optimum|maximum.*range/i.test(output.key + output.label)),
    false,
  );
  assert.match(lrc.notes?.join(" ") ?? "", /No optimum-altitude or maximum-range recommendation is inferred/i);
});

test("15.2c Normal Cruise blocks source-printed anomaly nodes and interpolation touching them", () => {
  const configured = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("fc530-standard", ["rosemount-pitot-static"]),
  );
  const normal = dataset(
    configured,
    "reference-normal-cruise-with-rosemount",
  );

  assert.equal(
    getPerformanceSelectionState(normal, filters(15000, 30000, -10)).status,
    "no-match",
  );
  assert.equal(
    getPerformanceSelectionState(normal, filters(15250, 30000, -5)).status,
    "no-match",
  );

  const safe = getPerformanceSelectionState(
    normal,
    filters(14000, 35000, 0),
  );
  assert.equal(safe.status, "exact");
  assert.deepEqual(safe.resultRow?.outputs, {
    machInd: 0.75,
    ktas: 431,
    fuelFlowLbPerHr: 1168,
  });
});

test("15.2c one-engine LRC preserves mixed Mach/KIAS semantics and fails closed across the unit boundary", () => {
  const configured = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("fc530-standard", ["rosemount-pitot-static"]),
  );
  const oneEngine = dataset(
    configured,
    "reference-lrc-one-engine-with-rosemount",
  );

  const mach = getPerformanceSelectionState(
    oneEngine,
    filters(10000, 30000, -10),
  );
  assert.equal(mach.status, "exact");
  assert.deepEqual(mach.resultRow?.outputs, {
    referenceSpeed: 0.504,
    referenceUnit: "MI",
    ktas: 289,
    fuelFlowLbPerHr: 606,
  });

  const kias = getPerformanceSelectionState(
    oneEngine,
    filters(10000, 15000, -10),
  );
  assert.equal(kias.status, "exact");
  assert.equal(kias.resultRow?.outputs.referenceUnit, "KIAS");

  assert.equal(
    getPerformanceSelectionState(
      oneEngine,
      filters(10000, 22500, -10),
    ).status,
    "no-match",
  );
});

test("15.2c one-engine LRC printed anomaly coordinates stay unavailable in the non-Rosemount runtime grid", () => {
  const configured = filterPerformanceForConfiguration(
    learjet35aReferencePerformancePackage.content,
    configurationForVariant("legacy", []),
  );
  const oneEngine = dataset(
    configured,
    "reference-lrc-one-engine-without-rosemount",
  );

  assert.equal(
    getPerformanceSelectionState(
      oneEngine,
      filters(16000, 25000, 10),
    ).status,
    "no-match",
  );
  assert.equal(
    getPerformanceSelectionState(
      oneEngine,
      filters(16000, 20000, 10),
    ).status,
    "no-match",
  );
});

test("15.2c High-Speed Cruise remains absent because the reviewed source has no table", () => {
  assert.equal(
    learjet35aReferencePerformancePackage.content.datasets.some(
      (item) => /high-speed/i.test(item.id + item.title),
    ),
    false,
  );
});
