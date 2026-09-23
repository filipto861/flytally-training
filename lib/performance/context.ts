import type { ActiveFlight } from "../active-flight/types.ts";

export type FlightPerformanceWeather = {
  readonly qnh: number;
  readonly oat: number;
};

export type FlightPerformanceContext = {
  readonly activeFlightId: string;
  readonly aircraftId: string;
  readonly dependencySnapshotId: string;
  readonly weight: {
    readonly value: number;
    readonly unit: "kg" | "lb";
  };
  readonly runway: {
    readonly identifier: string;
  };
  readonly configuration: {
    readonly flaps: string;
    readonly antiIce: boolean;
  };
  readonly weather: FlightPerformanceWeather | null;
};

export type PerformanceContextChange = {
  readonly key: "weight" | "runway" | "flaps" | "antiIce" | "qnh" | "oat";
  readonly label: string;
  readonly before: string;
  readonly after: string;
};

function fnv1a(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "p2:" + (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildPerformanceContext(
  activeFlight: ActiveFlight,
): FlightPerformanceContext | null {
  if (!activeFlight.runway || !activeFlight.configuration) return null;
  return {
    activeFlightId: activeFlight.id,
    aircraftId: activeFlight.aircraftId,
    dependencySnapshotId: activeFlight.performanceDependency.snapshotId,
    weight: activeFlight.weight,
    runway: activeFlight.runway,
    configuration: {
      flaps: activeFlight.configuration.flaps,
      antiIce: activeFlight.configuration.antiIce === true,
    },
    // Transitional B3 compatibility: the legacy Takeoff context only exists
    // when a runway/configuration has already been selected. B4 replaces this
    // with operation-owned Performance inputs.
    weather: null,
  };
}

export function computeContextHash(context: FlightPerformanceContext): string {
  return fnv1a(JSON.stringify({
    aircraftId: context.aircraftId,
    weight: context.weight,
    runway: context.runway,
    configuration: context.configuration,
    weather: context.weather,
  }));
}

export function isContextValid(
  current: FlightPerformanceContext,
  stored: FlightPerformanceContext,
): boolean {
  return computeContextHash(current) === computeContextHash(stored);
}

function weightLabel(context: FlightPerformanceContext): string {
  return `${context.weight.value.toLocaleString("en-US")} ${context.weight.unit}`;
}

function weatherValue(
  weather: FlightPerformanceWeather | null,
  key: "qnh" | "oat",
): string {
  if (!weather) return "Not set";
  return key === "qnh" ? `${weather.qnh}` : `${weather.oat} °C`;
}

export function diffPerformanceContext(
  stored: FlightPerformanceContext,
  current: FlightPerformanceContext,
): readonly PerformanceContextChange[] {
  const changes: PerformanceContextChange[] = [];

  if (
    stored.weight.value !== current.weight.value
    || stored.weight.unit !== current.weight.unit
  ) {
    changes.push({
      key: "weight",
      label: "Weight",
      before: weightLabel(stored),
      after: weightLabel(current),
    });
  }

  if (stored.runway.identifier !== current.runway.identifier) {
    changes.push({
      key: "runway",
      label: "Runway",
      before: stored.runway.identifier,
      after: current.runway.identifier,
    });
  }

  if (stored.configuration.flaps !== current.configuration.flaps) {
    changes.push({
      key: "flaps",
      label: "Flaps",
      before: stored.configuration.flaps,
      after: current.configuration.flaps,
    });
  }

  if (stored.configuration.antiIce !== current.configuration.antiIce) {
    changes.push({
      key: "antiIce",
      label: "Anti-ice",
      before: stored.configuration.antiIce ? "ON" : "OFF",
      after: current.configuration.antiIce ? "ON" : "OFF",
    });
  }

  for (const key of ["qnh", "oat"] as const) {
    const before = stored.weather?.[key];
    const after = current.weather?.[key];
    if (before !== after) {
      changes.push({
        key,
        label: key === "qnh" ? "QNH" : "OAT",
        before: weatherValue(stored.weather, key),
        after: weatherValue(current.weather, key),
      });
    }
  }

  return changes;
}
