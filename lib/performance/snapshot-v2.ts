import type { PilotTakeoffMetricResult } from "../pilot-takeoff-calculator.ts";

export type PerformanceOperation = "TAKEOFF" | "LANDING";

export type PerformanceInputProvenance =
  | "metar"
  | "manual"
  | "legacy-unknown";

export type WeatherObservationRefV2 = {
  readonly source: "aviationweather.gov";
  readonly station: string;
  readonly observedAt: string;
  readonly fetchedAt: string;
  readonly rawText: string;
  readonly windDirectionTrueDeg?: number;
  readonly windSpeedKt?: number;
  readonly windGustKt?: number;
  readonly windVariable?: boolean;
  readonly windCalm?: boolean;
};

export type AppliedWeatherFieldV2 = {
  readonly value: number;
  readonly source: PerformanceInputProvenance;
};

export type AppliedWeatherV2 = {
  readonly observation: WeatherObservationRefV2 | null;
  readonly qnhHpa?: AppliedWeatherFieldV2;
  readonly oatC?: AppliedWeatherFieldV2;
};

export type PerformanceRunwayReferenceV2 = {
  readonly airportIcao: string;
  readonly identifier: string;
  readonly provenance: "airport-db" | "legacy-unknown";
  readonly runwaySurfaceId?: string;
  readonly surfaceLengthFt?: number;
  readonly lengthBasis?: "physical-surface-length";
  readonly dataSource?: {
    readonly id: "ourairports";
    readonly snapshotDate: string;
  };
};

export type PerformanceSnapshotIdentityV2 = {
  readonly calculationId: string;
  readonly activeFlightId: string;
  readonly aircraftId: string;
  readonly variant: string | null;
};

export type PerformanceSnapshotAuditV2 = {
  /**
   * Audit/debug metadata only. This must never become an operation-validity
   * dependency; Takeoff and Landing own their own explicit dependencies.
   */
  readonly activeFlightDependencySnapshotId?: string;
};

export type PerformanceSnapshotSourceV2 = {
  readonly runtime: "takeoff-calculator" | "multi-axis-metric-grid";
  readonly calculatorId: string | null;
  readonly datasetIds: readonly string[];
};

export type TakeoffSnapshotV2 = {
  readonly schemaVersion: 2;
  readonly operation: "TAKEOFF";
  readonly identity: PerformanceSnapshotIdentityV2;
  readonly audit: PerformanceSnapshotAuditV2;
  readonly inputs: {
    readonly runway: PerformanceRunwayReferenceV2;
    readonly weight: {
      readonly value: number;
      readonly unit: "kg" | "lb";
    };
    readonly configuration: {
      readonly flaps: string;
      readonly antiIce: boolean;
    };
    /**
     * Native V2 calculations persist complete applied weather. Legacy v1
     * migration can be partial or null when the old record did not contain it.
     */
    readonly weather: AppliedWeatherV2 | null;
  };
  readonly derived: {
    readonly pressureAltitudeFt?: number;
  };
  readonly source: PerformanceSnapshotSourceV2;
  readonly result: {
    readonly n1: PilotTakeoffMetricResult;
    readonly v1: PilotTakeoffMetricResult;
    readonly vr: PilotTakeoffMetricResult;
    readonly v2: PilotTakeoffMetricResult;
    readonly takeoffDistance: PilotTakeoffMetricResult;
  };
  readonly calculatedAt: string;
  readonly migration: {
    readonly fromSchemaVersion: 1;
    readonly weatherProvenance: "legacy-unknown";
  } | null;
};

export type LandingSnapshotV2 = {
  readonly schemaVersion: 2;
  readonly operation: "LANDING";
  readonly identity: PerformanceSnapshotIdentityV2;
  readonly audit: PerformanceSnapshotAuditV2;
  readonly inputs: {
    readonly runway: PerformanceRunwayReferenceV2;
    readonly weight: {
      readonly value: number;
      readonly unit: "kg" | "lb";
    };
    readonly configuration: {
      readonly flaps: string;
    };
    readonly weather: AppliedWeatherV2;
  };
  readonly derived: {
    readonly pressureAltitudeFt?: number;
  };
  readonly source: {
    readonly runtime: "landing-calculator" | "multi-axis-metric-grid";
    readonly calculatorId: string | null;
    readonly datasetIds: readonly string[];
  };
  readonly result: {
    readonly vref: PilotTakeoffMetricResult;
    readonly landingClimbSpeed: PilotTakeoffMetricResult;
    readonly approachClimbSpeed: PilotTakeoffMetricResult;
    readonly landingDistance: PilotTakeoffMetricResult;
  };
  readonly calculatedAt: string;
  readonly migration: null;
};

export type PerformanceSnapshotV2 = TakeoffSnapshotV2 | LandingSnapshotV2;

export interface PerformanceSnapshotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function performanceSnapshotV2Key(
  operation: PerformanceOperation,
  aircraftId: string,
  activeFlightId: string,
): string {
  return [
    "flytally-training:performance-snapshot:v2",
    operation.toLowerCase(),
    aircraftId,
    activeFlightId,
  ].join(":");
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finiteOptionalNumber(value: unknown): boolean {
  return value === undefined || finiteNumber(value);
}

function validIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function metric(value: unknown): value is PilotTakeoffMetricResult {
  const row = object(value);
  if (
    !row
    || !["ready", "missing", "out-of-range", "unavailable", "pending"].includes(String(row.status))
  ) return false;
  if (!finiteOptionalNumber(row.value)) return false;
  if (row.unit !== undefined && typeof row.unit !== "string") return false;
  if (!finiteOptionalNumber(row.precision)) return false;
  if (row.reason !== undefined && typeof row.reason !== "string") return false;
  return row.status !== "ready" || finiteNumber(row.value);
}

function identity(value: unknown): value is PerformanceSnapshotIdentityV2 {
  const row = object(value);
  return Boolean(
    row
    && typeof row.calculationId === "string"
    && row.calculationId.length > 0
    && typeof row.activeFlightId === "string"
    && row.activeFlightId.length > 0
    && typeof row.aircraftId === "string"
    && row.aircraftId.length > 0
    && (row.variant === null || typeof row.variant === "string"),
  );
}

function audit(value: unknown): value is PerformanceSnapshotAuditV2 {
  const row = object(value);
  return Boolean(
    row
    && (
      row.activeFlightDependencySnapshotId === undefined
      || typeof row.activeFlightDependencySnapshotId === "string"
    ),
  );
}

function runway(value: unknown): value is PerformanceRunwayReferenceV2 {
  const row = object(value);
  const dataSource = row?.dataSource === undefined ? undefined : object(row.dataSource);
  if (
    !row
    || typeof row.airportIcao !== "string"
    || !row.airportIcao
    || typeof row.identifier !== "string"
    || !row.identifier
    || (row.provenance !== "airport-db" && row.provenance !== "legacy-unknown")
    || (row.runwaySurfaceId !== undefined && typeof row.runwaySurfaceId !== "string")
    || !finiteOptionalNumber(row.surfaceLengthFt)
    || (
      row.lengthBasis !== undefined
      && row.lengthBasis !== "physical-surface-length"
    )
  ) return false;

  if (row.dataSource !== undefined) {
    if (
      !dataSource
      || dataSource.id !== "ourairports"
      || typeof dataSource.snapshotDate !== "string"
    ) return false;
  }

  return true;
}

function weatherField(value: unknown): value is AppliedWeatherFieldV2 {
  const row = object(value);
  return Boolean(
    row
    && finiteNumber(row.value)
    && ["metar", "manual", "legacy-unknown"].includes(String(row.source)),
  );
}

function weatherObservation(value: unknown): value is WeatherObservationRefV2 {
  const row = object(value);
  return Boolean(
    row
    && row.source === "aviationweather.gov"
    && typeof row.station === "string"
    && row.station.length > 0
    && validIso(row.observedAt)
    && validIso(row.fetchedAt)
    && typeof row.rawText === "string"
    && finiteOptionalNumber(row.windDirectionTrueDeg)
    && finiteOptionalNumber(row.windSpeedKt)
    && finiteOptionalNumber(row.windGustKt)
    && (row.windVariable === undefined || typeof row.windVariable === "boolean")
    && (row.windCalm === undefined || typeof row.windCalm === "boolean"),
  );
}

function weather(value: unknown): value is AppliedWeatherV2 {
  const row = object(value);
  if (!row) return false;
  if (row.qnhHpa !== undefined && !weatherField(row.qnhHpa)) return false;
  if (row.oatC !== undefined && !weatherField(row.oatC)) return false;
  if (row.qnhHpa === undefined && row.oatC === undefined) return false;
  if (row.observation !== null && !weatherObservation(row.observation)) return false;

  const qnh = row.qnhHpa === undefined ? null : object(row.qnhHpa);
  const oat = row.oatC === undefined ? null : object(row.oatC);
  const metarBound = qnh?.source === "metar" || oat?.source === "metar";
  return !metarBound || row.observation !== null;
}

function takeoffSource(value: unknown): value is PerformanceSnapshotSourceV2 {
  const row = object(value);
  return Boolean(
    row
    && (row.runtime === "takeoff-calculator" || row.runtime === "multi-axis-metric-grid")
    && (row.calculatorId === null || typeof row.calculatorId === "string")
    && Array.isArray(row.datasetIds)
    && row.datasetIds.every((item) => typeof item === "string" && item.length > 0),
  );
}

function takeoffInputs(value: unknown): value is TakeoffSnapshotV2["inputs"] {
  const row = object(value);
  const weight = object(row?.weight);
  const configuration = object(row?.configuration);
  return Boolean(
    row
    && runway(row.runway)
    && weight
    && finiteNumber(weight.value)
    && (weight.unit === "kg" || weight.unit === "lb")
    && configuration
    && typeof configuration.flaps === "string"
    && typeof configuration.antiIce === "boolean"
    && (row.weather === null || weather(row.weather)),
  );
}

export function isTakeoffSnapshotV2(value: unknown): value is TakeoffSnapshotV2 {
  const row = object(value);
  const derived = object(row?.derived);
  const result = object(row?.result);
  const migration = row?.migration === null ? null : object(row?.migration);

  return Boolean(
    row
    && row.schemaVersion === 2
    && row.operation === "TAKEOFF"
    && identity(row.identity)
    && audit(row.audit)
    && takeoffInputs(row.inputs)
    && derived
    && finiteOptionalNumber(derived.pressureAltitudeFt)
    && takeoffSource(row.source)
    && result
    && metric(result.n1)
    && metric(result.v1)
    && metric(result.vr)
    && metric(result.v2)
    && metric(result.takeoffDistance)
    && validIso(row.calculatedAt)
    && (
      row.migration === null
      || (
        migration
        && migration.fromSchemaVersion === 1
        && migration.weatherProvenance === "legacy-unknown"
      )
    ),
  );
}

export type TakeoffSnapshotV2CurrentDependencies = {
  readonly variant: string | null;
  readonly pressureAltitudeFt?: number;
  readonly calculatorId: string | null;
  readonly datasetIds: readonly string[];
};

export type TakeoffSnapshotV2DependencyChange =
  | "variant"
  | "pressure-altitude"
  | "performance-source";

function normalizedIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)].sort();
}

export function diffTakeoffSnapshotV2Dependencies(
  snapshot: TakeoffSnapshotV2,
  current: TakeoffSnapshotV2CurrentDependencies,
): readonly TakeoffSnapshotV2DependencyChange[] {
  const changes: TakeoffSnapshotV2DependencyChange[] = [];

  if (snapshot.identity.variant !== current.variant) {
    changes.push("variant");
  }
  if (snapshot.derived.pressureAltitudeFt !== current.pressureAltitudeFt) {
    changes.push("pressure-altitude");
  }

  const storedIds = normalizedIds(snapshot.source.datasetIds);
  const currentIds = normalizedIds(current.datasetIds);
  if (
    snapshot.source.calculatorId !== current.calculatorId
    || storedIds.length !== currentIds.length
    || storedIds.some((id, index) => id !== currentIds[index])
  ) {
    changes.push("performance-source");
  }

  return changes;
}

export function takeoffSnapshotRequiresRecalculation(
  snapshot: TakeoffSnapshotV2,
): boolean {
  const weather = snapshot.inputs.weather;
  return Boolean(
    snapshot.migration
    || !weather
    || !weather.qnhHpa
    || !weather.oatC
    || weather.qnhHpa.source === "legacy-unknown"
    || weather.oatC.source === "legacy-unknown",
  );
}


function landingSource(value: unknown): boolean {
  const row = object(value);
  return Boolean(
    row
    && (row.runtime === "landing-calculator" || row.runtime === "multi-axis-metric-grid")
    && (row.calculatorId === null || typeof row.calculatorId === "string")
    && Array.isArray(row.datasetIds)
    && row.datasetIds.every((item) => typeof item === "string" && item.length > 0),
  );
}

export function isLandingSnapshotV2(value: unknown): value is LandingSnapshotV2 {
  const row = object(value);
  const inputs = object(row?.inputs);
  const weight = object(inputs?.weight);
  const configuration = object(inputs?.configuration);
  const derived = object(row?.derived);
  const result = object(row?.result);
  const appliedWeather = inputs?.weather;

  return Boolean(
    row
    && row.schemaVersion === 2
    && row.operation === "LANDING"
    && identity(row.identity)
    && audit(row.audit)
    && inputs
    && runway(inputs.runway)
    && weight
    && finiteNumber(weight.value)
    && (weight.unit === "kg" || weight.unit === "lb")
    && configuration
    && typeof configuration.flaps === "string"
    && weather(appliedWeather)
    && object(appliedWeather)?.qnhHpa !== undefined
    && object(appliedWeather)?.oatC !== undefined
    && derived
    && finiteOptionalNumber(derived.pressureAltitudeFt)
    && landingSource(row.source)
    && result
    && metric(result.vref)
    && metric(result.landingClimbSpeed)
    && metric(result.approachClimbSpeed)
    && metric(result.landingDistance)
    && validIso(row.calculatedAt)
    && row.migration === null
  );
}

export function isPerformanceSnapshotV2(value: unknown): value is PerformanceSnapshotV2 {
  return isTakeoffSnapshotV2(value) || isLandingSnapshotV2(value);
}
