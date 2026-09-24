import type { ActiveFlight } from "../active-flight/types.ts";
import type { PerformanceContextChange } from "./context.ts";

export type LandingPerformanceWeather = {
  readonly qnh: number;
  readonly oat: number;
};

export type LandingPerformanceSetup = {
  readonly runway: {
    readonly identifier: string;
    readonly airportIcao: string;
  };
  readonly weight: {
    readonly value: number;
    readonly unit: "kg" | "lb";
  };
  readonly configuration: {
    readonly flaps: string;
  };
  readonly weather: LandingPerformanceWeather;
};

export type LandingPerformanceContext = {
  readonly activeFlightId: string;
  readonly aircraftId: string;
  readonly dependencySnapshotId: string;
  readonly weight: {
    readonly value: number;
    readonly unit: "kg" | "lb";
  };
  readonly runway: {
    readonly identifier: string;
    readonly airportIcao: string;
  };
  readonly configuration: {
    readonly flaps: string;
  };
  readonly weather: LandingPerformanceWeather;
};

function fnv1a(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "landing:" + (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildLandingPerformanceContext(
  activeFlight: ActiveFlight,
  setup: LandingPerformanceSetup,
): LandingPerformanceContext {
  return {
    activeFlightId: activeFlight.id,
    aircraftId: activeFlight.aircraftId,
    dependencySnapshotId: activeFlight.performanceDependency.snapshotId,
    weight: setup.weight,
    runway: setup.runway,
    configuration: setup.configuration,
    weather: setup.weather,
  };
}

export function computeLandingContextHash(
  context: LandingPerformanceContext,
): string {
  return fnv1a(JSON.stringify({
    aircraftId: context.aircraftId,
    weight: context.weight,
    runway: context.runway,
    configuration: context.configuration,
    weather: context.weather,
  }));
}

export function isLandingContextValid(
  current: LandingPerformanceContext,
  stored: LandingPerformanceContext,
): boolean {
  return computeLandingContextHash(current) === computeLandingContextHash(stored);
}

function weightLabel(context: LandingPerformanceContext): string {
  return `${context.weight.value.toLocaleString("en-US")} ${context.weight.unit}`;
}

export function diffLandingPerformanceContext(
  stored: LandingPerformanceContext,
  current: LandingPerformanceContext,
): readonly PerformanceContextChange[] {
  const changes: PerformanceContextChange[] = [];

  if (
    stored.weight.value !== current.weight.value
    || stored.weight.unit !== current.weight.unit
  ) {
    changes.push({
      key: "weight",
      label: "Landing weight",
      before: weightLabel(stored),
      after: weightLabel(current),
    });
  }

  if (
    stored.runway.identifier !== current.runway.identifier
    || stored.runway.airportIcao !== current.runway.airportIcao
  ) {
    changes.push({
      key: "runway",
      label: "Landing runway",
      before: `${stored.runway.airportIcao} · ${stored.runway.identifier}`,
      after: `${current.runway.airportIcao} · ${current.runway.identifier}`,
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

  if (stored.weather.qnh !== current.weather.qnh) {
    changes.push({
      key: "qnh",
      label: "QNH",
      before: String(stored.weather.qnh),
      after: String(current.weather.qnh),
    });
  }

  if (stored.weather.oat !== current.weather.oat) {
    changes.push({
      key: "oat",
      label: "OAT",
      before: `${stored.weather.oat} °C`,
      after: `${current.weather.oat} °C`,
    });
  }

  return changes;
}
