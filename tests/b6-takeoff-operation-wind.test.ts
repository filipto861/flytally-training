import assert from "node:assert/strict";
import test from "node:test";

import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";
import type { SelectedRunwayContext } from "../lib/aviation/airport-types.ts";
import {
  computePerformance,
  createTakeoffSnapshotV2,
  performanceResultFromTakeoffSnapshotV2,
  takeoffSourceDatasetIds,
  weatherObservationRefV2,
} from "../lib/performance/client.ts";
import type { FlightPerformanceContext } from "../lib/performance/context.ts";
import { diffTakeoffSnapshotV2Dependencies } from "../lib/performance/snapshot-v2.ts";
import type { MetarSnapshot } from "../lib/weather/metar-types.ts";

const datasets = learjet35aPerformancePackage.content.datasets;
const definition = learjet35aPerformancePackage.takeoffCalculator;
assert.ok(definition);

const runwayContext: SelectedRunwayContext = {
  airportIcao: "LKPR",
  runwaySurfaceId: "LKPR-06-24",
  runwayIdent: "24",
  airportElevationFt: 1247,
  runwayEndElevationFt: 1245,
  oppositeEndElevationFt: 1280,
  headingTrueDeg: 243.4,
  surfaceLengthFt: 12189,
  lengthBasis: "physical-surface-length",
  dataSource: {
    id: "ourairports",
    snapshotDate: "2026-09-01",
  },
  surface: "ASP",
};

const observation: MetarSnapshot = {
  station: "LKPR",
  observedAt: "2026-09-24T06:30:00.000Z",
  fetchedAt: "2026-09-24T06:35:00.000Z",
  rawText: "LKPR 240630Z 24015KT CAVOK 16/08 Q1013",
  temperatureC: 16,
  qnhHpa: 1013.25,
  windDirectionTrueDeg: 240,
  windSpeedKt: 15,
  windVariable: false,
  windCalm: false,
  source: "aviationweather.gov",
};

function context(flaps = "8"): FlightPerformanceContext {
  return {
    activeFlightId: "flight-b6-001",
    aircraftId: "learjet-35a",
    dependencySnapshotId: "afd1:b6",
    weight: { value: 15000, unit: "lb" },
    runway: { identifier: "24", airportIcao: "LKPR" },
    configuration: { flaps, antiIce: false },
    weather: { qnh: 1013.25, oat: 16 },
  };
}

test("B6.3 Flaps 8 applies signed runway wind after the zero-wind baseline", () => {
  const result = computePerformance(
    context("8"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1300,
      oatC: 16,
      runwayWindComponentKt: 15,
    },
    "2026-09-24T07:00:00.000Z",
  );

  assert.equal(result.n1.status, "ready");
  assert.equal(result.vr.status, "ready");
  assert.equal(result.v2.status, "ready");

  assert.equal(result.v1.status, "ready");
  assert.ok(Math.abs((result.v1.value ?? 0) - 118) <= 1);

  assert.equal(result.takeoffDistance.status, "ready");
  assert.ok(Math.abs((result.takeoffDistance.value ?? 0) - 3400) <= 100);
});

test("B6.3 zero wind preserves the existing B4/B8 baseline exactly", () => {
  const result = computePerformance(
    context("8"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1300,
      oatC: 16,
      runwayWindComponentKt: 0,
    },
  );

  assert.equal(result.v1.status, "ready");
  assert.ok(Math.abs((result.v1.value ?? 0) - 116.3) < 0.001);
  assert.equal(result.takeoffDistance.status, "ready");
  assert.ok(Math.abs((result.takeoffDistance.value ?? 0) - 3699.5) < 0.001);
});

test("B6.3 missing applied runway wind fails closed only for wind-corrected outputs", () => {
  const result = computePerformance(
    context("8"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1300,
      oatC: 16,
    },
  );

  assert.equal(result.n1.status, "ready");
  assert.equal(result.vr.status, "ready");
  assert.equal(result.v2.status, "ready");
  assert.equal(result.v1.status, "missing");
  assert.match(result.v1.reason ?? "", /runway wind component/i);
  assert.equal(result.takeoffDistance.status, "missing");
  assert.match(result.takeoffDistance.reason ?? "", /runway wind component/i);
});

test("B6.3 Flaps 20 is zero-wind capable but nonzero wind remains fail-closed pending source verification", () => {
  const zeroWind = computePerformance(
    context("20"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1000,
      oatC: 16,
      runwayWindComponentKt: 0,
    },
  );
  assert.equal(zeroWind.v1.status, "ready");
  assert.equal(zeroWind.takeoffDistance.status, "ready");

  const headwind = computePerformance(
    context("20"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1000,
      oatC: 16,
      runwayWindComponentKt: 10,
    },
  );
  assert.equal(headwind.v1.status, "unavailable");
  assert.match(headwind.v1.reason ?? "", /no source-backed wind correction/i);
  assert.equal(headwind.takeoffDistance.status, "unavailable");
  assert.match(headwind.takeoffDistance.reason ?? "", /no source-backed wind correction/i);
  assert.equal(headwind.vr.status, "ready");
  assert.equal(headwind.v2.status, "ready");
  assert.equal(headwind.n1.status, "ready");
});

test("B6.3 source identity includes verified Flaps 8 wind datasets only", () => {
  const flaps8 = takeoffSourceDatasetIds(datasets, definition, context("8"));
  assert.ok(flaps8.includes("learjet-35a-v1-wind-flaps8"));
  assert.ok(flaps8.includes("learjet-35a-takeoff-distance-wind-flaps8"));

  const flaps20 = takeoffSourceDatasetIds(datasets, definition, context("20"));
  assert.equal(flaps20.some((id) => /wind-flaps20/i.test(id)), false);
  assert.equal(flaps20.some((id) => /wind-flaps8/i.test(id)), false);
});

test("B6.3 Snapshot V2 persists corrected outputs, applied observation and derived runway wind", () => {
  const result = computePerformance(
    context("8"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1300,
      oatC: 16,
      runwayWindComponentKt: 15,
    },
    "2026-09-24T07:00:00.000Z",
  );
  const datasetIds = takeoffSourceDatasetIds(datasets, definition, context("8"));

  const snapshot = createTakeoffSnapshotV2(result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "manual",
    oatSource: "manual",
    observation: weatherObservationRefV2(observation),
    datasetIds,
    calculatorId: definition.id,
  });

  assert.equal(snapshot.derived.runwayWindComponentKt, 15);
  assert.equal(snapshot.inputs.weather?.qnhHpa?.source, "manual");
  assert.equal(snapshot.inputs.weather?.oatC?.source, "manual");
  assert.equal(snapshot.inputs.weather?.observation?.windSpeedKt, 15);
  assert.deepEqual(snapshot.result.v1, result.v1);
  assert.deepEqual(snapshot.result.takeoffDistance, result.takeoffDistance);

  const restored = performanceResultFromTakeoffSnapshotV2(snapshot);
  assert.equal(restored.calculationInputs.runwayWindComponentKt, 15);
  assert.deepEqual(restored.v1, result.v1);
  assert.deepEqual(restored.takeoffDistance, result.takeoffDistance);
});

test("B6.3 runway-wind drift independently invalidates the Takeoff snapshot", () => {
  const result = computePerformance(
    context("8"),
    datasets,
    definition,
    {
      pressureAltitudeFt: 1300,
      oatC: 16,
      runwayWindComponentKt: 15,
    },
  );
  const datasetIds = takeoffSourceDatasetIds(datasets, definition, context("8"));
  const snapshot = createTakeoffSnapshotV2(result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "metar",
    oatSource: "metar",
    observation: weatherObservationRefV2(observation),
    datasetIds,
    calculatorId: definition.id,
  });

  assert.deepEqual(
    diffTakeoffSnapshotV2Dependencies(snapshot, {
      variant: "FC-530",
      pressureAltitudeFt: 1300,
      runwayWindComponentKt: 15,
      calculatorId: definition.id,
      datasetIds,
    }),
    [],
  );

  assert.deepEqual(
    diffTakeoffSnapshotV2Dependencies(snapshot, {
      variant: "FC-530",
      pressureAltitudeFt: 1300,
      runwayWindComponentKt: 10,
      calculatorId: definition.id,
      datasetIds,
    }),
    ["runway-wind"],
  );
});
