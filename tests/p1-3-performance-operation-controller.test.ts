import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  appliedWeatherFromSnapshot,
  autoApplyAvailableWeather,
  EMPTY_OPERATION_WEATHER,
  explicitlyApplyAvailableWeather,
  hydrateMatchingAppliedObservation,
  newerWeatherObservationAvailable,
  sameWeatherObservation,
  setManualWeatherField,
} from "../lib/performance/operation-weather.ts";
import type { AppliedWeatherV2 } from "../lib/performance/snapshot-v2.ts";
import type { MetarSnapshot } from "../lib/weather/metar-types.ts";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

const older: MetarSnapshot = {
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

const newer: MetarSnapshot = {
  ...older,
  observedAt: "2026-09-24T07:00:00.000Z",
  fetchedAt: "2026-09-24T07:05:00.000Z",
  rawText: "LKPR 240700Z 25012KT CAVOK 17/09 Q1011",
  temperatureC: 17,
  qnhHpa: 1011,
  windDirectionTrueDeg: 250,
  windSpeedKt: 12,
};

test("P1.3 compares AVAILABLE and APPLIED weather by observation identity and observed time", () => {
  const sameObservationRefetch: MetarSnapshot = {
    ...older,
    fetchedAt: "2026-09-24T06:40:00.000Z",
  };
  assert.equal(sameWeatherObservation(older, sameObservationRefetch), true);
  assert.equal(newerWeatherObservationAvailable(older, newer), true);
  assert.equal(newerWeatherObservationAvailable(newer, older), false);
  assert.equal(
    newerWeatherObservationAvailable(older, { ...newer, station: "LKTB" }),
    false,
  );
});

test("P1.3 clean AUTO bindings follow available METAR before calculation while manual fields stay sticky", () => {
  const manualQnh = setManualWeatherField(
    EMPTY_OPERATION_WEATHER,
    "qnhHpa",
    1009,
  );
  const applied = autoApplyAvailableWeather(manualQnh, newer);

  assert.deepEqual(applied.qnhHpa, { value: 1009, source: "manual" });
  assert.deepEqual(applied.oatC, { value: 17, source: "metar" });
  assert.equal(applied.observation?.observedAt, newer.observedAt);
});

test("P1.3 explicit latest-METAR action may replace manual bindings because it is user initiated", () => {
  const manual = setManualWeatherField(
    setManualWeatherField(EMPTY_OPERATION_WEATHER, "qnhHpa", 1009),
    "oatC",
    11,
  );
  const applied = explicitlyApplyAvailableWeather(manual, newer);

  assert.deepEqual(applied.qnhHpa, { value: 1011, source: "metar" });
  assert.deepEqual(applied.oatC, { value: 17, source: "metar" });
  assert.equal(applied.observation?.observedAt, newer.observedAt);
});

test("B6 APPLIED observation remains available for runway wind when QNH and OAT are manual", () => {
  const metarApplied = explicitlyApplyAvailableWeather(
    EMPTY_OPERATION_WEATHER,
    newer,
  );
  const manualQnh = setManualWeatherField(metarApplied, "qnhHpa", 1009);
  const manualBoth = setManualWeatherField(manualQnh, "oatC", 11);

  assert.deepEqual(manualBoth.qnhHpa, { value: 1009, source: "manual" });
  assert.deepEqual(manualBoth.oatC, { value: 11, source: "manual" });
  assert.equal(manualBoth.observation?.observedAt, newer.observedAt);
  assert.equal(manualBoth.observation?.windSpeedKt, newer.windSpeedKt);

  const manualBeforeMetar = setManualWeatherField(
    setManualWeatherField(EMPTY_OPERATION_WEATHER, "qnhHpa", 1009),
    "oatC",
    11,
  );
  const auto = autoApplyAvailableWeather(manualBeforeMetar, newer);
  assert.deepEqual(auto.qnhHpa, { value: 1009, source: "manual" });
  assert.deepEqual(auto.oatC, { value: 11, source: "manual" });
  assert.equal(auto.observation?.observedAt, newer.observedAt);
});

test("P1.3 stored APPLIED observation restores its wind independently of a newer AVAILABLE observation", () => {
  const stored: AppliedWeatherV2 = {
    observation: {
      source: "aviationweather.gov",
      station: "LKPR",
      observedAt: older.observedAt,
      fetchedAt: older.fetchedAt,
      rawText: older.rawText,
      windDirectionTrueDeg: older.windDirectionTrueDeg,
      windSpeedKt: older.windSpeedKt,
      windVariable: older.windVariable,
      windCalm: older.windCalm,
    },
    qnhHpa: { value: 1013.25, source: "metar" },
    oatC: { value: 15, source: "metar" },
  };

  const applied = appliedWeatherFromSnapshot(stored);
  assert.equal(applied.observation?.windDirectionTrueDeg, 240);
  assert.equal(applied.observation?.windSpeedKt, 8);
  assert.equal(newerWeatherObservationAvailable(applied.observation, newer), true);

  const unchanged = hydrateMatchingAppliedObservation(applied, newer);
  assert.equal(unchanged.observation?.observedAt, older.observedAt);
  assert.equal(unchanged.observation?.windSpeedKt, 8);
});

test("P1.3 matching refetch may hydrate APPLIED observation details without changing observation identity", () => {
  const sparse: AppliedWeatherV2 = {
    observation: {
      source: "aviationweather.gov",
      station: "LKPR",
      observedAt: older.observedAt,
      fetchedAt: older.fetchedAt,
      rawText: older.rawText,
    },
    qnhHpa: { value: 1013.25, source: "metar" },
    oatC: { value: 15, source: "metar" },
  };

  const applied = appliedWeatherFromSnapshot(sparse);
  assert.equal(applied.observation?.windSpeedKt, undefined);

  const hydrated = hydrateMatchingAppliedObservation(applied, older);
  assert.equal(hydrated.observation?.observedAt, older.observedAt);
  assert.equal(hydrated.observation?.windSpeedKt, 8);
});

test("P1.3 presentation delegates operation state calculation persistence and weather fetching to one controller", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");
  const controller = read("components/ft-performance/use-performance-operation.ts");

  assert.match(presentation, /usePerformanceOperation\("TAKEOFF"/);
  assert.doesNotMatch(presentation, /useState|useEffect|fetch\(|computePerformance|readTakeoffPerformanceState|writeTakeoffPerformanceResultV2/);

  assert.match(controller, /readTakeoffPerformanceState/);
  assert.match(controller, /writeTakeoffPerformanceResultV2/);
  assert.match(controller, /computePerformance/);
  assert.match(controller, /\/api\/weather\/metar\?icao=/);
  assert.match(controller, /diffTakeoffSnapshotV2Dependencies/);
  assert.match(controller, /isContextValid/);
});

test("P1.3 wind presentation is derived from APPLIED observation and never directly from AVAILABLE weather", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const helperBlock = controller.slice(
    controller.indexOf("function windComponentsForAppliedWeather"),
    controller.indexOf("function roundedRunwayWindComponentKt"),
  );
  const windBlock = controller.slice(
    controller.indexOf("const wind = useMemo"),
    controller.indexOf("const currentContext = useMemo"),
  );

  assert.match(helperBlock, /weather\.observation/);
  assert.doesNotMatch(helperBlock, /availableWeather/);
  assert.match(windBlock, /windComponentsForAppliedWeather\(appliedWeather, runwayContext\)/);
  assert.doesNotMatch(windBlock, /availableWeather/);
});

test("B6 automatic METAR refresh recalculates an existing displayed result", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");

  assert.match(controller, /const METAR_REFRESH_MS = 5 \* 60 \* 1000/);
  assert.match(controller, /window\.setInterval\([\s\S]*refreshMetar\(\)[\s\S]*METAR_REFRESH_MS/);
  assert.match(
    controller,
    /setAppliedWeather\(\(previous\) => autoApplyAvailableWeather\(previous, payload\)\)/,
  );
  assert.match(
    controller,
    /key === lastAutoCalculatedWeatherKey\.current[\s\S]*hasDisplayedCalculation[\s\S]*canCalculate[\s\S]*calculateWithWeather\(appliedWeather\)/,
  );
});

test("P1.3 UI is AUTO-METAR by default and exposes reset only after manual override", () => {
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");
  const controller = read("components/ft-performance/use-performance-operation.ts");

  assert.doesNotMatch(presentation, /NEWER WEATHER AVAILABLE/);
  assert.doesNotMatch(presentation, /Apply & recalculate|Use latest METAR/);
  assert.match(presentation, /manualWeatherOverride && availableWeather/);
  assert.match(presentation, /AUTO METAR/);
  assert.match(controller, /explicitlyApplyAvailableWeather/);
  assert.match(controller, /manualWeatherOverride/);
});

test("P1.3 newer AVAILABLE weather does not participate in result stale validity", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const staleBlock = controller.slice(
    controller.indexOf("const stale = Boolean"),
    controller.indexOf("const changes ="),
  );

  assert.doesNotMatch(staleBlock, /availableWeather|newerWeatherAvailable/);
  assert.match(staleBlock, /storedState\?\.requiresRecalculation/);
  assert.match(staleBlock, /snapshotDependencyChanges\.length > 0/);
  assert.match(staleBlock, /isContextValid/);
});


test("UX calculate action paints a disabled loading state before synchronous performance work", () => {
  const controller = read("components/ft-performance/use-performance-operation.ts");
  const presentation = read("components/ft-performance/FtPerformancePresentation.tsx");
  const styles = read("components/ft-performance/ft-performance.module.css");

  assert.match(controller, /calculationPending\.current/);
  assert.match(controller, /setBusy\(true\)[\s\S]*requestAnimationFrame/);
  assert.match(controller, /requestAnimationFrame\([\s\S]*computePerformance/);
  assert.match(presentation, /aria-busy=\{busy\}/);
  assert.match(presentation, /data-loading=\{busy \? "true" : "false"\}/);
  assert.match(presentation, /Calculating…/);
  assert.match(styles, /action\[data-loading="true"\]::before/);
  assert.match(styles, /ft-performance-spin/);
});
