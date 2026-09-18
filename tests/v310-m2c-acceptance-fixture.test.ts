import assert from "node:assert/strict";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import {
  buildPerformanceCalculatorProfile,
  calculateLandingDistance,
  calculateTakeoffDistance,
  getMetricLookupResults,
} from "../lib/performance-calculator.ts";
import { calculateWeightBalance } from "../lib/weight-balance-calculator.ts";
import {
  buildV31AcceptancePerformance,
  buildV31AcceptanceWeightBalance,
} from "./fixtures/v31-second-aircraft.ts";

const aircraftId = "acceptance-v31-second-aircraft";
const source = { manualId: "acceptance-r1", pageLabel: "1" } as const;
const performance = buildV31AcceptancePerformance(aircraftId, source);
const weightBalance = buildV31AcceptanceWeightBalance(aircraftId, source);

test("v3.1 M2C fixture is valid without Learjet-shaped calculator keys", () => {
  assert.deepEqual(validateContentPayload("performance", performance, aircraftId), []);
  assert.deepEqual(validateContentPayload("weight-balance", weightBalance, aircraftId), []);

  const serialized = JSON.stringify({ performance, weightBalance });
  assert.doesNotMatch(serialized, /"weight"|"surface"|"vref"|"vapp"|"wet8"|"wet20"/i);
});

test("v3.1 M2C fixture executes declared performance after ordinary JSON round-trip", () => {
  const roundTrip = JSON.parse(JSON.stringify(performance)) as typeof performance;
  const profile = buildPerformanceCalculatorProfile(roundTrip.datasets);

  const takeoff = calculateTakeoffDistance(profile, {
    dryDistance: 500,
    runwayAvailable: 700,
    weight: 1000,
    surface: "damp",
  });
  assert.equal(takeoff.status, "ready");
  assert.equal(takeoff.correctedDistance, 550);

  const landing = calculateLandingDistance(profile, {
    dryDistance: 400,
    runwayAvailable: 800,
    surface: "ice",
    oatC: 4,
  });
  assert.equal(landing.status, "ready");
  assert.equal(landing.correctedDistance, 720);

  const metrics = getMetricLookupResults(profile.landingSpeedDataset, 900);
  assert.deepEqual(metrics, [
    { key: "referenceVelocity", label: "Reference speed", unit: "KIAS", value: 70 },
    { key: "approachVelocity", label: "Approach speed", unit: "KIAS", value: 75 },
  ]);
});

test("v3.1 M2C fixture executes imperial W&B presentation after JSON round-trip", () => {
  const roundTrip = JSON.parse(JSON.stringify(weightBalance)) as typeof weightBalance;
  const pilotLb = 80 * roundTrip.units!.mass!.fromNormalized;
  const takeoffGal = 40 * roundTrip.units!.volume!.fromNormalized;
  const landingGal = 10 * roundTrip.units!.volume!.fromNormalized;
  const result = calculateWeightBalance(roundTrip, {
    values: { pilot: pilotLb, fuel: takeoffGal },
    landingFuelValue: landingGal,
  });
  assert.equal(result.status, "ready");
  assert.ok(Math.abs((result.takeoff?.massKg ?? 0) - 508.8) < 1e-7);
  assert.ok(Math.abs((result.landing?.massKg ?? 0) - 487.2) < 1e-7);
});
