import assert from "node:assert/strict";
import test from "node:test";

import {
  learjet35aQrhElectricalConfigurationKeys,
  learjet35aQrhEmergencyBatch7,
  learjet35aQrhEmergencyBatch7ReleaseStatus,
} from "../aircraft-data/learjet-35a/qrh/emergency-batch-7.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import { validateUniversalAbnormalEmergencyPayload } from "../lib/universal-abnormal-emergency.ts";

function configuration(
  serialNumber: string,
  amk851: "installed" | "not-installed" | "unknown",
  amk7813: "installed" | "not-installed" | "unknown",
): AircraftConfiguration {
  return {
    variant: "source-review",
    serialNumber,
    equipment: new Set<string>(),
    modifications: new Map([
      ["amk-85-1", amk851],
      ["amk-78-13", amk7813],
    ]),
    configurationEquipment: new Map([
      [learjet35aQrhElectricalConfigurationKeys.nicadBatteries, "installed"],
    ]),
  };
}

test("QRH.3U Electrical reconciliation batch satisfies the generic v2 contract", () => {
  assert.equal(learjet35aQrhEmergencyBatch7ReleaseStatus, "staged-source-review");
  assert.deepEqual(
    validateUniversalAbnormalEmergencyPayload(learjet35aQrhEmergencyBatch7),
    [],
  );
  assert.deepEqual(
    learjet35aQrhEmergencyBatch7.scenarios.map((scenario) => scenario.title),
    [
      "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
      "CURRENT LIMITER FAILURE",
      "ESSENTIAL BUS FAILURE — DC POWER LOSS",
    ],
  );
});

test("QRH.3U preserves the early E-6 and E-7/E-8 source families", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch7,
    configuration("35-100", "not-installed", "not-installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => [
      scenario.id,
      scenario.stages.map((stage) => stage.id),
    ]),
    [
      ["battery-overheat-lights-nicad-only", ["battery-overheat-e6"]],
      ["current-limiter-failure", ["current-limiter-e6"]],
      ["essential-bus-failure-dc-power-loss", ["essential-bus-e7-e8"]],
    ],
  );
});

test("QRH.3U prior aircraft with incorporated AMKs select E-6.1 and E-7.1", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch7,
    configuration("35-100", "installed", "installed"),
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => [
      scenario.id,
      scenario.stages.map((stage) => stage.id),
    ]),
    [
      ["battery-overheat-lights-nicad-only", ["battery-overheat-e6-1"]],
      ["current-limiter-failure", ["current-limiter-e6-1"]],
      ["essential-bus-failure-dc-power-loss", ["essential-bus-e7-1"]],
    ],
  );
});

test("QRH.3U late serial families do not require inferred AMK state", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch7,
    {
      variant: "source-review",
      serialNumber: "35-600",
      equipment: new Set<string>(),
      configurationEquipment: new Map([
        [learjet35aQrhElectricalConfigurationKeys.nicadBatteries, "installed"],
      ]),
    },
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.stages.map((stage) => stage.id)),
    [
      ["battery-overheat-e6-1"],
      ["current-limiter-e6-1"],
      ["essential-bus-e7-1"],
    ],
  );
});

test("QRH.3U prior serial with unknown AMK state fails closed", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch7,
    configuration("35-100", "unknown", "unknown"),
  );
  assert.deepEqual(filtered.scenarios, []);
});

test("QRH.3U source differences are preserved rather than normalized", () => {
  const currentLimiter = learjet35aQrhEmergencyBatch7.scenarios.find(
    (scenario) => scenario.id === "current-limiter-failure",
  );
  const essential = learjet35aQrhEmergencyBatch7.scenarios.find(
    (scenario) => scenario.id === "essential-bus-failure-dc-power-loss",
  );
  assert.ok(currentLimiter);
  assert.ok(essential);

  const serialized = JSON.stringify(currentLimiter);
  assert.match(serialized, /Electrical Load — REDUCE & MONITOR/);
  assert.match(serialized, /Windshield Aux Defog \(if installed\) — OFF/);
  assert.match(serialized, /Recog Light — OFF/);

  assert.deepEqual(
    essential.sources?.map((item) => item.pageLabel),
    ["E-7–E-8", "E-7.1"],
  );
  assert.match(JSON.stringify(essential), /Both Audio Panels — PH \(use headphones\)/);
  assert.match(JSON.stringify(essential), /Both Affected ESS BUS Loads — REDUCE/);
});

test("QRH.3U visual review found no boxed memory items on E-6/E-6.1/E-7/E-8/E-7.1", () => {
  assert.equal(
    JSON.stringify(learjet35aQrhEmergencyBatch7).includes('"memoryItem":true'),
    false,
  );
});


test("QRH.3U BATTERY OVERHEAT remains fail-closed without explicit NICAD configuration", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhEmergencyBatch7,
    {
      variant: "source-review",
      serialNumber: "35-600",
      equipment: new Set<string>(),
    },
  );
  assert.deepEqual(
    filtered.scenarios.map((scenario) => scenario.id),
    [
      "current-limiter-failure",
      "essential-bus-failure-dc-power-loss",
    ],
  );
});
