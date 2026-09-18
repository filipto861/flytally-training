import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import type { AircraftWeightBalanceContent } from "../lib/universal-weight-balance.ts";
import { calculateWeightBalance, formatWeightBalanceValue, normalizedToWeightBalanceDisplay, weightBalanceUnit } from "../lib/weight-balance-calculator.ts";

const source = [{ manualId: "imperial-afm", pageLabel: "6-1" }];
const imperial: AircraftWeightBalanceContent = {
  aircraftId: "second-aircraft",
  title: "Weight & Balance",
  units: {
    mass: { label: "lb", fromNormalized: 2.2046226218, decimals: 0 },
    arm: { label: "in", fromNormalized: 0.03937007874, decimals: 1 },
    moment: { label: "lb·in", fromNormalized: 0.0867961662, decimals: 0 },
    volume: { label: "US gal", fromNormalized: 0.2641720524, decimals: 1 },
  },
  empty: { massKg: 400, armMm: 800, momentKgMm: 320000, sources: source },
  limits: {
    maxTakeoffMassKg: 600,
    envelope: [
      { massKg: 400, forwardCgMm: 700, aftCgMm: 1000 },
      { massKg: 600, forwardCgMm: 700, aftCgMm: 1000 },
    ],
    sources: source,
  },
  stations: [
    { id: "pilot", label: "Pilot", armMm: 900, input: "mass-kg", required: true, sources: source },
    { id: "fuel", label: "Fuel", armMm: 600, input: "fuel-litres", required: true, densityKgPerL: 0.72, sources: source },
  ],
  fuelBurnStationId: "fuel",
};

test("v3.1 M2B2 validates declarative non-SI W&B display/input units", () => {
  assert.deepEqual(validateContentPayload("weight-balance", imperial, imperial.aircraftId), []);
  assert.equal(weightBalanceUnit(imperial, "mass").label, "lb");
  assert.equal(formatWeightBalanceValue(imperial, "mass", 600), "1323 lb");
  assert.ok(Math.abs(normalizedToWeightBalanceDisplay(imperial, "arm", 25.4) - 1) < 1e-9);
});

test("v3.1 M2B2 converts pilot-facing lb and US gal inputs to normalized calculation values", () => {
  const pilotLb = 80 * imperial.units!.mass!.fromNormalized;
  const takeoffGal = 40 * imperial.units!.volume!.fromNormalized;
  const landingGal = 10 * imperial.units!.volume!.fromNormalized;
  const result = calculateWeightBalance(imperial, {
    values: { pilot: pilotLb, fuel: takeoffGal },
    landingFuelValue: landingGal,
  });
  assert.equal(result.status, "ready");
  assert.ok(Math.abs((result.takeoff?.massKg ?? 0) - 508.8) < 1e-7);
  assert.ok(Math.abs((result.landing?.massKg ?? 0) - 487.2) < 1e-7);
});

test("v3.1 M2B2 routes declared performance through shared data-driven UI while preserving legacy adapters", () => {
  const declared = fs.readFileSync(new URL("../components/declarative-performance-workspace.tsx", import.meta.url), "utf8");
  const full = fs.readFileSync(new URL("../components/performance-calculator.tsx", import.meta.url), "utf8");
  const fly = fs.readFileSync(new URL("../components/operational-performance.tsx", import.meta.url), "utf8");
  assert.match(declared, /calculator\.baselineDistanceInput\.label/);
  assert.match(declared, /metric\.label/);
  assert.match(declared, /calculator\.oatInput\.unit/);
  assert.match(full, /DeclarativePerformanceWorkspace/);
  assert.match(fly, /DeclarativePerformanceWorkspace/);
  assert.match(full, /LegacyPerformanceCalculator/);
  assert.match(fly, /LegacyOperationalPerformance/);
  assert.doesNotMatch(declared, /VREF|VAPP|KIAS|wet8|wet20|Learjet|Bristell|Cessna/i);
});

test("v3.1 M2B2 W&B learner UI gets units from governed content", () => {
  const source = fs.readFileSync(new URL("../components/weight-balance-calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /weightBalanceUnit\(content/);
  assert.match(source, /formatWeightBalanceValue\(content/);
});
