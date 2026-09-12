import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { aircraftWorkspaceSections } from "../lib/aircraft-workspace-navigation.ts";
import { configurationForVariant, matchesAircraftApplicability } from "../lib/aircraft-applicability.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import type { AircraftWeightBalanceContent } from "../lib/universal-weight-balance.ts";
import { calculateWeightBalance } from "../lib/weight-balance-calculator.ts";

const source = [{ manualId: "generic-afm", chapter: "6", section: "Weight and balance", pageLabel: "6-1" }];
const content: AircraftWeightBalanceContent = {
  aircraftId: "generic-aircraft",
  title: "Weight & Balance",
  empty: { massKg: 400, armMm: 800, momentKgMm: 320000, sources: source },
  limits: {
    maxTakeoffMassKg: 600,
    maxLandingMassKg: 600,
    envelope: [
      { massKg: 400, forwardCgMm: 750, aftCgMm: 900 },
      { massKg: 600, forwardCgMm: 750, aftCgMm: 900 },
    ],
    cgScale: { label: "% MAC", points: [{ cgMm: 750, value: 25 }, { cgMm: 900, value: 35 }] },
    sources: source,
  },
  stations: [
    { id: "pilot", label: "Pilot", armMm: 1000, input: "mass-kg", required: true, minimumMassKg: 55, sources: source },
    { id: "passenger", label: "Passenger", armMm: 1000, input: "mass-kg", sources: source },
    { id: "baggage", label: "Baggage", armMm: 1600, input: "mass-kg", maxMassKg: 20, sources: source },
    { id: "fuel", label: "Fuel", armMm: 600, input: "fuel-litres", required: true, maxVolumeL: 100, densityKgPerL: 0.72, sources: source },
  ],
  fuelBurnStationId: "fuel",
};

test("M41 validates a generic source-backed weight-and-balance module", () => {
  assert.deepEqual(validateContentPayload("weight-balance", content, content.aircraftId), []);
  assert.ok(aircraftWorkspaceSections(content.aircraftId, ["weight-balance"]).some((section) => section.key === "weight-balance"));
});

test("M42 weight-and-balance supports explicit aircraft-configuration applicability", () => {
  const scoped: AircraftWeightBalanceContent = { ...content, applicability: { variants: ["serial-a"] } };
  assert.deepEqual(validateContentPayload("weight-balance", scoped, scoped.aircraftId), []);
  assert.equal(matchesAircraftApplicability(scoped.applicability, configurationForVariant("serial-a")), true);
  assert.equal(matchesAircraftApplicability(scoped.applicability, configurationForVariant("serial-b")), false);
  assert.match(validateContentPayload("weight-balance", { ...content, applicability: { variants: [] } }, content.aircraftId).join("; "), /variants must be a non-empty array/i);
});

test("M41 calculates takeoff and landing from empty moment plus station moments", () => {
  const result = calculateWeightBalance(content, {
    values: { pilot: 80, passenger: 70, baggage: 10, fuel: 40 },
    landingFuelValue: 10,
  });
  assert.equal(result.status, "ready");
  assert.ok(result.takeoff);
  assert.ok(result.landing);
  assert.ok(Math.abs((result.takeoff?.massKg ?? 0) - 588.8) < 1e-9);
  assert.ok(Math.abs((result.takeoff?.momentKgMm ?? 0) - 503280) < 1e-9);
  assert.ok(Math.abs((result.takeoff?.cgMm ?? 0) - (503280 / 588.8)) < 1e-9);
  assert.ok((result.cgShiftMm ?? 0) > 0, "forward fuel station should move CG aft as fuel burns");
});

test("M41 checks the planned landing state instead of accepting takeoff CG only", () => {
  const narrow: AircraftWeightBalanceContent = {
    ...content,
    limits: {
      ...content.limits,
      envelope: [
        { massKg: 400, forwardCgMm: 750, aftCgMm: 860 },
        { massKg: 600, forwardCgMm: 750, aftCgMm: 860 },
      ],
    },
  };
  const result = calculateWeightBalance(narrow, {
    values: { pilot: 80, passenger: 70, baggage: 10, fuel: 40 },
    landingFuelValue: 10,
  });
  assert.equal(result.takeoff?.withinCg, true);
  assert.equal(result.landing?.withinCg, false);
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some((issue) => /Landing CG is outside/i.test(issue)));
});

test("M41 fails closed on station limits and impossible fuel state", () => {
  const result = calculateWeightBalance(content, {
    values: { pilot: 50, passenger: 70, baggage: 25, fuel: 30 },
    landingFuelValue: 40,
  });
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some((issue) => /Pilot: minimum 55 kg/i.test(issue)));
  assert.ok(result.issues.some((issue) => /Baggage: exceeds 20 kg/i.test(issue)));
  assert.ok(result.issues.some((issue) => /landing quantity cannot exceed takeoff quantity/i.test(issue)));
});

test("M41 learner implementation is aircraft-agnostic and source-driven", () => {
  const page = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/weight-balance/page.tsx", import.meta.url), "utf8");
  const calculator = fs.readFileSync(new URL("../components/weight-balance-calculator.tsx", import.meta.url), "utf8");
  const engine = fs.readFileSync(new URL("../lib/weight-balance-calculator.ts", import.meta.url), "utf8");
  assert.match(page, /getPublishedAircraftModule<AircraftWeightBalanceContent>/);
  assert.match(page, /matchesAircraftApplicability\(content\.applicability, configuration\)/);
  assert.match(calculator, /planned landing state/i);
  assert.match(calculator, /mass × arm/i);
  assert.doesNotMatch(`${page}${calculator}${engine}`, /bristell|learjet|cessna|rotax/i);
});
