"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  findAirport,
  loadAirportDataset,
} from "@/lib/aviation/airport-dataset";
import {
  availableRunwayEnds,
  resolveRunwayEnd,
} from "@/lib/aviation/runway-context";
import { calculatePressureAltitudeFt } from "@/lib/aviation/pressure-altitude";
import { calculateWindComponents } from "@/lib/aviation/wind-component";
import type {
  AirportDatasetV1,
  SelectedRunwayContext,
} from "@/lib/aviation/airport-types";
import {
  getClientCachedMetar,
  setClientCachedMetar,
} from "@/lib/weather/metar-cache";
import { isMetarSnapshot } from "@/lib/weather/metar-snapshot-helpers";
import type { MetarSnapshot } from "@/lib/weather/metar-types";

export type PerformanceFieldMode = "auto" | "manual";

export type PerformanceField = {
  readonly value: string;
  readonly mode: PerformanceFieldMode;
};

export type WeatherLoadState =
  | "idle"
  | "loading"
  | "live"
  | "cached"
  | "no-report"
  | "error";

const autoField = (value = ""): PerformanceField => ({ value, mode: "auto" });
const manualField = (value: string): PerformanceField => ({ value, mode: "manual" });

function finite(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function usePerformanceEnvironment(
  airportIcao: string | null,
  initialRunwayIdent?: string,
) {
  const [dataset, setDataset] = useState<AirportDatasetV1>();
  const [airportState, setAirportState] = useState<"loading" | "ready" | "error">("loading");
  const [runwayIdent, setRunwayIdent] = useState(initialRunwayIdent ?? "");
  const [metar, setMetar] = useState<MetarSnapshot | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherLoadState>("idle");
  const [qnh, setQnh] = useState<PerformanceField>(autoField());
  const [oat, setOat] = useState<PerformanceField>(autoField());
  const [pressureAltitude, setPressureAltitude] = useState<PerformanceField>(autoField());

  useEffect(() => {
    let active = true;
    setAirportState("loading");
    loadAirportDataset()
      .then((value) => {
        if (!active) return;
        setDataset(value);
        setAirportState("ready");
      })
      .catch(() => {
        if (!active) return;
        setDataset(undefined);
        setAirportState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const airport = useMemo(
    () => dataset && airportIcao ? findAirport(dataset, airportIcao) : undefined,
    [airportIcao, dataset],
  );

  const runwayOptions = useMemo(
    () => airport ? availableRunwayEnds(airport) : [],
    [airport],
  );

  useEffect(() => {
    if (!airport) {
      setRunwayIdent("");
      return;
    }
    const requested = (initialRunwayIdent ?? "").trim().toUpperCase();
    setRunwayIdent(
      requested && runwayOptions.some((candidate) => candidate.ident === requested)
        ? requested
        : "",
    );
  }, [airport?.icao, initialRunwayIdent, runwayOptions]);

  const runwayContext: SelectedRunwayContext | undefined = useMemo(
    () => airport && runwayIdent ? resolveRunwayEnd(airport, runwayIdent) : undefined,
    [airport, runwayIdent],
  );

  const applyMetarToAutoFields = useCallback((snapshot: MetarSnapshot) => {
    if (snapshot.qnhHpa !== undefined) {
      setQnh((current) => current.mode === "manual"
        ? current
        : autoField(String(Math.round(snapshot.qnhHpa * 100) / 100)));
    }
    if (snapshot.temperatureC !== undefined) {
      setOat((current) => current.mode === "manual"
        ? current
        : autoField(String(snapshot.temperatureC)));
    }
  }, []);

  const requestWeather = useCallback(async () => {
    if (!airportIcao) {
      setMetar(null);
      setWeatherState("idle");
      return;
    }

    const station = airportIcao.toUpperCase();
    const cached = getClientCachedMetar(station);
    if (cached) {
      setMetar(cached.snapshot);
      setWeatherState("cached");
      applyMetarToAutoFields(cached.snapshot);
    } else {
      setWeatherState("loading");
    }

    try {
      const response = await fetch(
        `/api/weather/metar?icao=${encodeURIComponent(station)}`,
        { cache: "no-store" },
      );
      if (response.status === 204) {
        if (!cached) {
          setMetar(null);
          setWeatherState("no-report");
        }
        return;
      }
      if (!response.ok) {
        if (!cached) setWeatherState("error");
        return;
      }
      const payload: unknown = await response.json();
      if (!isMetarSnapshot(payload)) {
        if (!cached) setWeatherState("error");
        return;
      }
      setClientCachedMetar(station, payload);
      setMetar(payload);
      setWeatherState("live");
      applyMetarToAutoFields(payload);
    } catch {
      if (!cached) setWeatherState("error");
    }
  }, [airportIcao, applyMetarToAutoFields]);

  useEffect(() => {
    setMetar(null);
    setQnh(autoField());
    setOat(autoField());
    setPressureAltitude(autoField());
    void requestWeather();
  }, [airportIcao, requestWeather]);

  const derivedPressureAltitude = useMemo(() => {
    const qnhHpa = finite(qnh.value);
    if (!airport || qnhHpa === undefined) return undefined;
    try {
      return Math.round(calculatePressureAltitudeFt(
        airport.elevationFt,
        { unit: "hPa", value: qnhHpa },
      ));
    } catch {
      return undefined;
    }
  }, [airport, qnh.value]);

  useEffect(() => {
    if (derivedPressureAltitude === undefined) return;
    setPressureAltitude((current) => current.mode === "manual"
      ? current
      : autoField(String(derivedPressureAltitude)));
  }, [derivedPressureAltitude]);

  const wind = useMemo(() => {
    if (
      !runwayContext
      || runwayContext.headingTrueDeg === undefined
      || !metar
      || metar.windSpeedKt === undefined
    ) return undefined;

    const direction = metar.windCalm
      ? runwayContext.headingTrueDeg
      : metar.windDirectionTrueDeg;
    if (direction === undefined) return undefined;

    return calculateWindComponents({
      windDirectionTrueDeg: direction,
      windSpeedKt: metar.windSpeedKt,
      windGustKt: metar.windGustKt,
      runwayHeadingTrueDeg: runwayContext.headingTrueDeg,
    });
  }, [metar, runwayContext]);

  return {
    airportState,
    dataset,
    airport,
    runwayOptions,
    runwayIdent,
    setRunwayIdent,
    runwayContext,
    metar,
    weatherState,
    refreshWeather: requestWeather,
    qnh,
    oat,
    pressureAltitude,
    setQnhManual: (value: string) => setQnh(manualField(value)),
    setOatManual: (value: string) => setOat(manualField(value)),
    setPressureAltitudeManual: (value: string) => setPressureAltitude(manualField(value)),
    resetQnhAuto: () => {
      const value = metar?.qnhHpa;
      setQnh(autoField(value === undefined ? "" : String(Math.round(value * 100) / 100)));
    },
    resetOatAuto: () => {
      setOat(autoField(metar?.temperatureC === undefined ? "" : String(metar.temperatureC)));
    },
    resetPressureAltitudeAuto: () => {
      setPressureAltitude(autoField(
        derivedPressureAltitude === undefined ? "" : String(derivedPressureAltitude),
      ));
    },
    wind,
  };
}
