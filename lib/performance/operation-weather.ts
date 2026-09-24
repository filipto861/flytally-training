import type {
  AppliedWeatherV2,
  PerformanceInputProvenance,
  WeatherObservationRefV2,
} from "./snapshot-v2.ts";
import type { MetarSnapshot } from "../weather/metar-types.ts";

export type OperationWeatherSource = PerformanceInputProvenance | "unset";

export type OperationWeatherField = {
  readonly value?: number;
  readonly source: OperationWeatherSource;
};

export type OperationAppliedWeather = {
  readonly qnhHpa: OperationWeatherField;
  readonly oatC: OperationWeatherField;
  readonly observation: MetarSnapshot | null;
};

export const EMPTY_OPERATION_WEATHER: OperationAppliedWeather = {
  qnhHpa: { source: "unset" },
  oatC: { source: "unset" },
  observation: null,
};

function roundedQnh(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sameWeatherObservation(
  left: Pick<MetarSnapshot, "source" | "station" | "observedAt"> | null | undefined,
  right: Pick<MetarSnapshot, "source" | "station" | "observedAt"> | null | undefined,
): boolean {
  if (!left || !right) return false;
  return (
    left.source === right.source
    && left.station.toUpperCase() === right.station.toUpperCase()
    && left.observedAt === right.observedAt
  );
}

export function newerWeatherObservationAvailable(
  applied: Pick<MetarSnapshot, "source" | "station" | "observedAt"> | null | undefined,
  available: Pick<MetarSnapshot, "source" | "station" | "observedAt"> | null | undefined,
): boolean {
  if (!applied || !available) return false;
  if (
    applied.source !== available.source
    || applied.station.toUpperCase() !== available.station.toUpperCase()
  ) return false;

  const appliedTime = Date.parse(applied.observedAt);
  const availableTime = Date.parse(available.observedAt);
  return (
    Number.isFinite(appliedTime)
    && Number.isFinite(availableTime)
    && availableTime > appliedTime
  );
}

export function weatherObservationRefToMetarSnapshot(
  ref: WeatherObservationRefV2,
  weather?: AppliedWeatherV2 | null,
): MetarSnapshot {
  return {
    station: ref.station,
    observedAt: ref.observedAt,
    fetchedAt: ref.fetchedAt,
    rawText: ref.rawText,
    ...(weather?.oatC?.value === undefined ? {} : { temperatureC: weather.oatC.value }),
    ...(weather?.qnhHpa?.value === undefined ? {} : { qnhHpa: weather.qnhHpa.value }),
    ...(ref.windDirectionTrueDeg === undefined
      ? {}
      : { windDirectionTrueDeg: ref.windDirectionTrueDeg }),
    ...(ref.windSpeedKt === undefined ? {} : { windSpeedKt: ref.windSpeedKt }),
    ...(ref.windGustKt === undefined ? {} : { windGustKt: ref.windGustKt }),
    windVariable: ref.windVariable ?? false,
    windCalm: ref.windCalm ?? false,
    source: ref.source,
  };
}

export function appliedWeatherFromSnapshot(
  weather: AppliedWeatherV2 | null | undefined,
): OperationAppliedWeather {
  if (!weather) return EMPTY_OPERATION_WEATHER;

  return {
    qnhHpa: weather.qnhHpa
      ? { value: weather.qnhHpa.value, source: weather.qnhHpa.source }
      : { source: "unset" },
    oatC: weather.oatC
      ? { value: weather.oatC.value, source: weather.oatC.source }
      : { source: "unset" },
    observation: weather.observation
      ? weatherObservationRefToMetarSnapshot(weather.observation, weather)
      : null,
  };
}

export function autoApplyAvailableWeather(
  current: OperationAppliedWeather,
  available: MetarSnapshot,
): OperationAppliedWeather {
  const qnhHpa = current.qnhHpa.source === "manual" || available.qnhHpa === undefined
    ? current.qnhHpa
    : { value: roundedQnh(available.qnhHpa), source: "metar" as const };
  const oatC = current.oatC.source === "manual" || available.temperatureC === undefined
    ? current.oatC
    : { value: available.temperatureC, source: "metar" as const };
  const metarBound = qnhHpa.source === "metar" || oatC.source === "metar";

  return {
    qnhHpa,
    oatC,
    observation: metarBound ? available : null,
  };
}

export function explicitlyApplyAvailableWeather(
  current: OperationAppliedWeather,
  available: MetarSnapshot,
): OperationAppliedWeather {
  const qnhHpa = available.qnhHpa === undefined
    ? current.qnhHpa
    : { value: roundedQnh(available.qnhHpa), source: "metar" as const };
  const oatC = available.temperatureC === undefined
    ? current.oatC
    : { value: available.temperatureC, source: "metar" as const };
  const metarBound = qnhHpa.source === "metar" || oatC.source === "metar";

  return {
    qnhHpa,
    oatC,
    observation: metarBound ? available : null,
  };
}

export function setManualWeatherField(
  current: OperationAppliedWeather,
  field: "qnhHpa" | "oatC",
  value: number | undefined,
): OperationAppliedWeather {
  const next = {
    ...current,
    [field]: {
      ...(value === undefined ? {} : { value }),
      source: "manual" as const,
    },
  };
  const metarBound =
    next.qnhHpa.source === "metar"
    || next.oatC.source === "metar";

  return {
    ...next,
    observation: metarBound ? current.observation : null,
  };
}

export function hydrateMatchingAppliedObservation(
  current: OperationAppliedWeather,
  available: MetarSnapshot,
): OperationAppliedWeather {
  if (!current.observation || !sameWeatherObservation(current.observation, available)) {
    return current;
  }
  return {
    ...current,
    observation: available,
  };
}

export function weatherForCalculation(
  weather: OperationAppliedWeather,
): { readonly qnh: number; readonly oat: number } | null {
  if (
    weather.qnhHpa.value === undefined
    || weather.oatC.value === undefined
  ) return null;

  return {
    qnh: weather.qnhHpa.value,
    oat: weather.oatC.value,
  };
}
