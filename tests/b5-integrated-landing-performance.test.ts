import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { learjet35aPerformancePackage } from "../aircraft-data/learjet-35a/performance/package.ts";
import { browserTrainingPerformancePackage } from "../lib/browser-training-fixture.ts";
import type { SelectedRunwayContext } from "../lib/aviation/airport-types.ts";
import {
  computeLandingPerformance,
  landingSourceDatasetIds,
  readLandingPerformanceState,
  weatherObservationRefV2,
  writeLandingPerformanceResultV2,
  type PerformanceResultStorage,
} from "../lib/performance/client.ts";
import {
  buildLandingPerformanceContext,
  computeLandingContextHash,
  diffLandingPerformanceContext,
  type LandingPerformanceContext,
} from "../lib/performance/landing-context.ts";
import {
  diffLandingSnapshotV2Dependencies,
  isLandingSnapshotV2,
  performanceSnapshotV2Key,
} from "../lib/performance/snapshot-v2.ts";
import type { MetarSnapshot } from "../lib/weather/metar-types.ts";
import type { ActiveFlight } from "../lib/active-flight/types.ts";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

class MemoryStorage implements PerformanceResultStorage {
  readonly rows = new Map<string, string>();

  getItem(key: string): string | null {
    return this.rows.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.rows.set(key, value);
  }

  removeItem(key: string): void {
    this.rows.delete(key);
  }
}

const flight: ActiveFlight = {
  id: "flight-b5-001",
  aircraftId: "learjet-35a",
  accountSubject: "local",
  lifecycle: "ACTIVE",
  departure: { icao: "LKPR" },
  destination: { icao: "LOWW" },
  runway: null,
  weight: { value: 15000, unit: "lb" },
  configuration: null,
  weather: null,
  performanceDependency: { snapshotId: "afd1:b5-audit" },
  brief: null,
  createdAt: "2026-09-24T08:00:00.000Z",
  updatedAt: "2026-09-24T08:00:00.000Z",
  activatedAt: "2026-09-24T08:00:00.000Z",
  deactivatedAt: null,
  archivedAt: null,
};

const runwayContext: SelectedRunwayContext = {
  airportIcao: "LOWW",
  runwaySurfaceId: "LOWW-16-34",
  runwayIdent: "34",
  airportElevationFt: 600,
  runwayEndElevationFt: 580,
  oppositeEndElevationFt: 600,
  headingTrueDeg: 342,
  surfaceLengthFt: 11811,
  lengthBasis: "physical-surface-length",
  dataSource: {
    id: "ourairports",
    snapshotDate: "2026-09-01",
  },
  surface: "ASP",
};

const metar: MetarSnapshot = {
  station: "LOWW",
  observedAt: "2026-09-24T08:20:00.000Z",
  fetchedAt: "2026-09-24T08:22:00.000Z",
  rawText: "LOWW 240820Z 34008KT CAVOK 16/08 Q1013",
  temperatureC: 16,
  qnhHpa: 1013.25,
  windDirectionTrueDeg: 340,
  windSpeedKt: 8,
  windVariable: false,
  windCalm: false,
  source: "aviationweather.gov",
};

const context: LandingPerformanceContext = buildLandingPerformanceContext(flight, {
  runway: { identifier: "34", airportIcao: "LOWW" },
  weight: { value: 15000, unit: "lb" },
  configuration: { flaps: "40" },
  weather: { qnh: 1013.25, oat: 16 },
});

test("B5 Landing context is destination-owned and excludes Takeoff configuration", () => {
  assert.equal(context.runway.airportIcao, "LOWW");
  assert.equal(context.configuration.flaps, "40");
  assert.equal("antiIce" in context.configuration, false);
  assert.match(computeLandingContextHash(context), /^landing:/);

  const changed = {
    ...context,
    runway: { identifier: "29", airportIcao: "LOWW" },
    weight: { value: 14500, unit: "lb" as const },
  };
  const changes = diffLandingPerformanceContext(context, changed);
  assert.deepEqual(changes.map((item) => item.key), ["weight", "runway"]);
});

test("B5 computes the existing source-backed Landing metrics without VAPP or wind correction", () => {
  const definition = learjet35aPerformancePackage.landingCalculator;
  assert.ok(definition);

  const result = computeLandingPerformance(
    context,
    learjet35aPerformancePackage.content.datasets,
    definition,
    { pressureAltitudeFt: 0, oatC: 16 },
    "2026-09-24T08:30:00.000Z",
  );

  assert.equal(result.vref.value, 127);
  assert.equal(result.landingClimbSpeed.value, 127);
  assert.equal(result.approachClimbSpeed.value, 135);
  assert.equal(result.landingDistance.value, 5015);
  assert.equal("vapp" in result, false);
  assert.equal(result.context.runway.airportIcao, "LOWW");
});

test("B5 persists a native Landing V2 snapshot independently from Takeoff", () => {
  const definition = learjet35aPerformancePackage.landingCalculator;
  assert.ok(definition);

  const result = computeLandingPerformance(
    context,
    learjet35aPerformancePackage.content.datasets,
    definition,
    { pressureAltitudeFt: 0, oatC: 16 },
    "2026-09-24T08:30:00.000Z",
  );
  const storage = new MemoryStorage();
  const datasetIds = landingSourceDatasetIds(definition);

  const snapshot = writeLandingPerformanceResultV2(storage, result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "metar",
    oatSource: "metar",
    observation: weatherObservationRefV2(metar),
    datasetIds,
    calculatorId: null,
  });

  assert.equal(isLandingSnapshotV2(snapshot), true);
  assert.equal(snapshot.operation, "LANDING");
  assert.equal(snapshot.inputs.runway.airportIcao, "LOWW");
  assert.equal(snapshot.inputs.runway.identifier, "34");
  assert.equal(snapshot.inputs.configuration.flaps, "40");
  assert.equal(snapshot.inputs.weather.observation?.station, "LOWW");
  assert.equal(snapshot.result.vref.value, 127);
  assert.equal(snapshot.result.landingDistance.value, 5015);
  assert.equal("vapp" in snapshot.result, false);

  const landingKey = performanceSnapshotV2Key("LANDING", "learjet-35a", "flight-b5-001");
  const takeoffKey = performanceSnapshotV2Key("TAKEOFF", "learjet-35a", "flight-b5-001");
  assert.ok(storage.getItem(landingKey));
  assert.equal(storage.getItem(takeoffKey), null);

  const restored = readLandingPerformanceState(storage, "learjet-35a", "flight-b5-001");
  assert.ok(restored);
  assert.equal(restored.requiresRecalculation, false);
  assert.equal(restored.result.context.runway.airportIcao, "LOWW");
  assert.equal(restored.result.landingDistance.value, 5015);
});

test("B5 Landing dependency validity is operation-scoped", () => {
  const definition = learjet35aPerformancePackage.landingCalculator;
  assert.ok(definition);

  const result = computeLandingPerformance(
    context,
    learjet35aPerformancePackage.content.datasets,
    definition,
    { pressureAltitudeFt: 0, oatC: 16 },
  );
  const storage = new MemoryStorage();
  const snapshot = writeLandingPerformanceResultV2(storage, result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "manual",
    oatSource: "manual",
    observation: null,
    datasetIds: landingSourceDatasetIds(definition),
    calculatorId: null,
  });

  assert.deepEqual(
    diffLandingSnapshotV2Dependencies(snapshot, {
      variant: "FC-530A",
      pressureAltitudeFt: 1000,
      calculatorId: "replacement",
      datasetIds: ["replacement-source"],
    }),
    ["variant", "pressure-altitude", "performance-source"],
  );
});

test("B5 deterministic browser fixture carries a valid Landing package for browser acceptance", () => {
  const definition = browserTrainingPerformancePackage.landingCalculator;
  assert.ok(definition);

  const browserContext: LandingPerformanceContext = {
    activeFlightId: "browser-flight",
    aircraftId: "browser-ci-aircraft",
    dependencySnapshotId: "browser-audit",
    weight: { value: 12000, unit: "lb" },
    runway: { identifier: "34", airportIcao: "LOWW" },
    configuration: { flaps: "40" },
    weather: { qnh: 1013.25, oat: 15 },
  };

  const result = computeLandingPerformance(
    browserContext,
    browserTrainingPerformancePackage.content.datasets,
    definition,
    { pressureAltitudeFt: 600, oatC: 15 },
  );

  assert.equal(result.vref.value, 118);
  assert.equal(result.landingClimbSpeed.value, 118);
  assert.equal(result.approachClimbSpeed.value, 124);
  assert.equal(result.landingDistance.value, 2800);
});

test("B5 controller binds airport and weather to destination and keeps Landing persistence separate", () => {
  const controller = read("components/ft-performance/use-landing-performance-operation.ts");

  assert.match(controller, /current\.destination\.icao/);
  const facade = read("components/ft-performance/use-performance-operation.ts");
  assert.match(facade, /operation: "LANDING"/);
  assert.match(facade, /useLandingPerformanceOperation/);
  assert.match(controller, /readLandingPerformanceState/);
  assert.match(controller, /writeLandingPerformanceResultV2/);
  assert.match(controller, /buildLandingPerformanceContext/);
  assert.match(controller, /diffLandingSnapshotV2Dependencies/);
  assert.match(controller, /weatherLocked/);
  assert.match(controller, /newerWeatherObservationAvailable/);
  assert.doesNotMatch(controller, /current\.departure\.icao/);
  assert.doesNotMatch(controller, /windComponentKt/);
});

test("B5 presentation exposes governed Landing inputs and only source-backed outputs", () => {
  const presentation = read("components/ft-performance/FtLandingPerformancePresentation.tsx");
  const strip = read("components/ft-performance/FtLandingPerformanceStrip.tsx");

  assert.match(presentation, /LANDING INPUTS/);
  assert.match(presentation, /aria-label="Landing runway"/);
  assert.match(presentation, /aria-label="Landing weight"/);
  assert.match(presentation, /aria-label="Landing flaps"/);
  assert.match(presentation, /Calculate Landing/);
  assert.match(presentation, /NEWER WEATHER AVAILABLE/);
  assert.match(presentation, /does not apply wind, slope or declared-distance corrections/);

  for (const label of ["VREF", "Landing Climb", "Approach Climb", "Landing Distance"]) {
    assert.match(strip, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(strip, /VAPP/);
});

test("B5 Flight Brief and dedicated Performance page share the Landing operation instead of a second calculator", () => {
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const editor = read("components/ft-flight/FtPerformanceEditorSheet.tsx");
  const page = read("components/ft-performance/FtPerformancePage.tsx");
  const flightRoute = read("app/aircraft/[aircraftId]/flight/page.tsx");
  const performanceRoute = read("app/aircraft/[aircraftId]/performance/page.tsx");

  assert.match(brief, /usePerformanceOperation\("LANDING"/);
  assert.match(brief, /aria-label="Landing performance brief"/);
  assert.match(brief, /FtLandingPerformanceStrip/);
  assert.match(editor, /FtLandingPerformanceOperationPresentation/);
  assert.match(page, /FtLandingPerformancePresentation/);
  assert.match(flightRoute, /landingCalculator=\{bundledPackage\?\.landingCalculator\}/);
  assert.match(performanceRoute, /landingCalculator=\{bundledPackage\?\.landingCalculator\}/);

  for (const source of [brief, editor, page]) {
    assert.doesNotMatch(source, /calculatePilotLandingSummary|writeLandingPerformanceResultV2/);
  }
});
