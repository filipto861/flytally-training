import assert from "node:assert/strict";
import test from "node:test";

import {
  createTakeoffSnapshotV2,
  performanceResultKey,
  readTakeoffPerformanceState,
  weatherObservationRefV2,
  writePerformanceResult,
  writeTakeoffPerformanceResultV2,
  type PerformanceResult,
  type PerformanceResultStorage,
} from "../lib/performance/client.ts";
import {
  computeContextHash,
  type FlightPerformanceContext,
} from "../lib/performance/context.ts";
import {
  diffTakeoffSnapshotV2Dependencies,
  isLandingSnapshotV2,
  isTakeoffSnapshotV2,
  performanceSnapshotV2Key,
  takeoffSnapshotRequiresRecalculation,
  type LandingSnapshotV2,
} from "../lib/performance/snapshot-v2.ts";
import type { SelectedRunwayContext } from "../lib/aviation/airport-types.ts";
import type { MetarSnapshot } from "../lib/weather/metar-types.ts";

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

const context: FlightPerformanceContext = {
  activeFlightId: "flight-p12-001",
  aircraftId: "learjet-35a",
  dependencySnapshotId: "afd1:old-audit-only",
  weight: { value: 15000, unit: "lb" },
  runway: { identifier: "24", airportIcao: "LKPR" },
  configuration: { flaps: "8", antiIce: false },
  weather: { qnh: 1013.25, oat: 15 },
};

const result: PerformanceResult = {
  context,
  contextHash: computeContextHash(context),
  n1: { status: "ready", value: 96.4, unit: "%", precision: 1 },
  v1: { status: "ready", value: 116, unit: "KIAS" },
  vr: { status: "ready", value: 123, unit: "KIAS" },
  v2: { status: "ready", value: 130, unit: "KIAS" },
  takeoffDistance: { status: "ready", value: 4100, unit: "ft" },
  computedAt: "2026-09-24T07:00:00.000Z",
  source: "takeoff-calculator",
  calculationInputs: {
    pressureAltitudeFt: 1247,
    oatC: 15,
  },
};

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

const metar: MetarSnapshot = {
  station: "LKPR",
  observedAt: "2026-09-24T06:30:00.000Z",
  fetchedAt: "2026-09-24T06:35:00.000Z",
  rawText: "LKPR 240630Z 24008KT CAVOK 15/08 Q1013",
  temperatureC: 15,
  qnhHpa: 1013.25,
  windDirectionTrueDeg: 240,
  windSpeedKt: 8,
  windVariable: false,
  windCalm: false,
  source: "aviationweather.gov",
};

test("P1.2 uses separate V2 storage identities for Takeoff and Landing", () => {
  const takeoff = performanceSnapshotV2Key("TAKEOFF", "learjet-35a", "flight-1");
  const landing = performanceSnapshotV2Key("LANDING", "learjet-35a", "flight-1");

  assert.notEqual(takeoff, landing);
  assert.equal(
    takeoff,
    "flytally-training:performance-snapshot:v2:takeoff:learjet-35a:flight-1",
  );
  assert.equal(
    landing,
    "flytally-training:performance-snapshot:v2:landing:learjet-35a:flight-1",
  );
});

test("P1.2 native Takeoff snapshot captures explicit identity source inputs result and provenance", () => {
  const observation = weatherObservationRefV2(metar);
  const snapshot = createTakeoffSnapshotV2(result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "metar",
    oatSource: "manual",
    observation,
    datasetIds: ["v2-source", "n1-source", "v2-source"],
    calculatorId: "takeoff-summary",
  });

  assert.equal(snapshot.schemaVersion, 2);
  assert.equal(snapshot.operation, "TAKEOFF");
  assert.equal(snapshot.identity.aircraftId, "learjet-35a");
  assert.equal(snapshot.identity.activeFlightId, "flight-p12-001");
  assert.equal(snapshot.identity.variant, "FC-530");
  assert.equal(snapshot.audit.activeFlightDependencySnapshotId, "afd1:old-audit-only");

  assert.deepEqual(snapshot.inputs.runway, {
    airportIcao: "LKPR",
    identifier: "24",
    provenance: "airport-db",
    runwaySurfaceId: "LKPR-06-24",
    surfaceLengthFt: 12189,
    lengthBasis: "physical-surface-length",
    dataSource: {
      id: "ourairports",
      snapshotDate: "2026-09-01",
    },
  });
  assert.equal("toraFt" in snapshot.inputs.runway, false);
  assert.equal(snapshot.inputs.weather?.qnhHpa?.source, "metar");
  assert.equal(snapshot.inputs.weather?.oatC?.source, "manual");
  assert.deepEqual(snapshot.inputs.weather?.observation, observation);
  assert.deepEqual(snapshot.source.datasetIds, ["n1-source", "v2-source"]);
  assert.equal(snapshot.source.calculatorId, "takeoff-summary");
  assert.equal(snapshot.derived.pressureAltitudeFt, 1247);
  assert.deepEqual(snapshot.result.v1, result.v1);
  assert.equal(snapshot.migration, null);

  assert.equal(isTakeoffSnapshotV2(snapshot), true);
  assert.equal(takeoffSnapshotRequiresRecalculation(snapshot), false);
  assert.doesNotMatch(JSON.stringify(snapshot), /"isStale"|"stale"|"validity"/);
});

test("P1.2 V2 validity dependencies exclude the global Active Flight dependency snapshot id", () => {
  const dependencyOnlyChange = {
    ...context,
    dependencySnapshotId: "afd1:changed-audit-only",
  };
  assert.equal(computeContextHash(dependencyOnlyChange), computeContextHash(context));

  const snapshot = createTakeoffSnapshotV2(result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "manual",
    oatSource: "manual",
    observation: null,
    datasetIds: ["n1-source", "v1-source"],
    calculatorId: "takeoff-summary",
  });

  const auditChanged = {
    ...snapshot,
    audit: {
      activeFlightDependencySnapshotId: "afd1:different-global-revision",
    },
  };

  const current = {
    variant: "FC-530",
    pressureAltitudeFt: 1247,
    calculatorId: "takeoff-summary",
    datasetIds: ["v1-source", "n1-source"],
  } as const;

  assert.deepEqual(diffTakeoffSnapshotV2Dependencies(snapshot, current), []);
  assert.deepEqual(diffTakeoffSnapshotV2Dependencies(auditChanged, current), []);
});

test("P1.2 V2 validity detects variant derived-input and performance-source drift", () => {
  const snapshot = createTakeoffSnapshotV2(result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "manual",
    oatSource: "manual",
    observation: null,
    datasetIds: ["n1-source"],
    calculatorId: "takeoff-summary",
  });

  assert.deepEqual(
    diffTakeoffSnapshotV2Dependencies(snapshot, {
      variant: "FC-530A",
      pressureAltitudeFt: 1300,
      calculatorId: "takeoff-summary-v2",
      datasetIds: ["replacement-source"],
    }),
    ["variant", "pressure-altitude", "performance-source"],
  );
});

test("P1.2 native writer persists only the V2 Takeoff key", () => {
  const storage = new MemoryStorage();
  const snapshot = writeTakeoffPerformanceResultV2(storage, result, {
    variant: "FC-530",
    runwayContext,
    qnhSource: "metar",
    oatSource: "metar",
    observation: weatherObservationRefV2(metar),
    datasetIds: ["n1-source"],
    calculatorId: "takeoff-summary",
  });

  const v2Key = performanceSnapshotV2Key("TAKEOFF", "learjet-35a", "flight-p12-001");
  assert.equal(isTakeoffSnapshotV2(JSON.parse(storage.getItem(v2Key) ?? "null")), true);
  assert.equal(storage.getItem(performanceResultKey("learjet-35a", "flight-p12-001")), null);
  assert.equal(snapshot.migration, null);
});

test("P1.2 migrates a valid v1 result without inventing weather provenance and retains the v1 key", () => {
  const storage = new MemoryStorage();
  writePerformanceResult(storage, result);

  const legacyKey = performanceResultKey("learjet-35a", "flight-p12-001");
  const before = storage.getItem(legacyKey);
  assert.ok(before);

  const restored = readTakeoffPerformanceState(storage, "learjet-35a", "flight-p12-001");
  assert.ok(restored);
  assert.equal(restored.migratedFromLegacy, true);
  assert.equal(restored.requiresRecalculation, true);
  assert.equal(restored.snapshot.migration?.fromSchemaVersion, 1);
  assert.equal(restored.snapshot.inputs.weather?.observation, null);
  assert.equal(restored.snapshot.inputs.weather?.qnhHpa?.source, "legacy-unknown");
  assert.equal(restored.snapshot.inputs.weather?.oatC?.source, "legacy-unknown");
  assert.equal(restored.snapshot.identity.variant, null);
  assert.equal(restored.snapshot.inputs.runway.provenance, "legacy-unknown");

  const v2Key = performanceSnapshotV2Key("TAKEOFF", "learjet-35a", "flight-p12-001");
  assert.ok(storage.getItem(v2Key));
  assert.equal(storage.getItem(legacyKey), before);
});

test("P1.2 migration preserves a known legacy OAT even when the old context had no QNH/weather object", () => {
  const storage = new MemoryStorage();
  const oldContext = {
    ...context,
    weather: null,
  };
  const oldResult: PerformanceResult = {
    ...result,
    context: oldContext,
    contextHash: computeContextHash(oldContext),
    calculationInputs: {
      pressureAltitudeFt: 1247,
      oatC: 12,
    },
  };
  writePerformanceResult(storage, oldResult);

  const restored = readTakeoffPerformanceState(storage, "learjet-35a", "flight-p12-001");
  assert.ok(restored);
  assert.equal(restored.snapshot.inputs.weather?.qnhHpa, undefined);
  assert.equal(restored.snapshot.inputs.weather?.oatC?.value, 12);
  assert.equal(restored.snapshot.inputs.weather?.oatC?.source, "legacy-unknown");
  assert.equal(restored.requiresRecalculation, true);
});

test("P1.2 invalid V2 data fails closed and never resurrects the retained v1 key", () => {
  const storage = new MemoryStorage();
  writePerformanceResult(storage, result);

  const v2Key = performanceSnapshotV2Key("TAKEOFF", "learjet-35a", "flight-p12-001");
  const invalidV2 = JSON.stringify({ schemaVersion: 2, operation: "TAKEOFF" });
  storage.setItem(v2Key, invalidV2);

  assert.equal(readTakeoffPerformanceState(storage, "learjet-35a", "flight-p12-001"), null);
  assert.equal(storage.getItem(v2Key), invalidV2);
  assert.ok(storage.getItem(performanceResultKey("learjet-35a", "flight-p12-001")));

  assert.equal(readTakeoffPerformanceState(storage, "learjet-35a", "flight-p12-001"), null);
  assert.equal(storage.getItem(v2Key), invalidV2);
});

test("P1.2 Landing Snapshot V2 contract is operation-separated and validates source-backed fields", () => {
  const landing: LandingSnapshotV2 = {
    schemaVersion: 2,
    operation: "LANDING",
    identity: {
      calculationId: "landing:flight-p12-001:1",
      activeFlightId: "flight-p12-001",
      aircraftId: "learjet-35a",
      variant: "FC-530",
    },
    audit: {
      activeFlightDependencySnapshotId: "afd1:audit-only",
    },
    inputs: {
      runway: {
        airportIcao: "LOWW",
        identifier: "34",
        provenance: "airport-db",
        runwaySurfaceId: "LOWW-16-34",
        surfaceLengthFt: 11811,
        lengthBasis: "physical-surface-length",
        dataSource: {
          id: "ourairports",
          snapshotDate: "2026-09-01",
        },
      },
      weight: { value: 13000, unit: "lb" },
      configuration: { flaps: "40" },
      weather: {
        observation: null,
        qnhHpa: { value: 1015, source: "manual" },
        oatC: { value: 18, source: "manual" },
      },
    },
    derived: {
      pressureAltitudeFt: 650,
    },
    source: {
      runtime: "landing-calculator",
      calculatorId: "landing-summary",
      datasetIds: [
        "learjet-35a-vref",
        "learjet-35a-landing-distance-flaps40",
      ],
    },
    result: {
      vref: { status: "ready", value: 121, unit: "KIAS" },
      landingClimbSpeed: { status: "ready", value: 124, unit: "KIAS" },
      approachClimbSpeed: { status: "ready", value: 130, unit: "KIAS" },
      landingDistance: { status: "ready", value: 3600, unit: "ft" },
    },
    calculatedAt: "2026-09-24T07:05:00.000Z",
    migration: null,
  };

  assert.equal(isLandingSnapshotV2(landing), true);
  assert.notEqual(
    performanceSnapshotV2Key("TAKEOFF", landing.identity.aircraftId, landing.identity.activeFlightId),
    performanceSnapshotV2Key("LANDING", landing.identity.aircraftId, landing.identity.activeFlightId),
  );
});
