import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveEffectiveAircraftConfiguration,
} from "../lib/effective-aircraft-configuration.ts";
import { realSecondAircraft } from "./fixtures/v31-real-second-aircraft.ts";

test("existing Bristell configuration resolves without requiring structured metadata", () => {
  const variantProfile = realSecondAircraft.variantProfiles?.[0];
  assert.ok(variantProfile);

  const result = resolveEffectiveAircraftConfiguration({
    aircraft: realSecondAircraft,
    variantProfile,
  });

  assert.equal(result.aircraftId, "bristell-lsa");
  assert.equal(result.variantKey, "sn809-2025");
  assert.equal(result.baseVariantKey, "sn809-2025");
  assert.deepEqual(result.equipmentTags, variantProfile.equipmentTags);
  assert.deepEqual(result.capabilityTags, []);
  assert.deepEqual(result.modifications, []);
  assert.deepEqual(result.configurationEquipment, []);
  assert.deepEqual(result.dataHealth, []);
});

test("complex configuration resolves explicit Learjet-style installation metadata", () => {
  const input = {
    aircraft: {
      id: "learjet-30",
      equipmentTags: [],
    },
    variantProfile: {
      key: "35a-zr-lite-aeromech",
      displayName: "Learjet 35A ZR LITE + AeroMech RVSM",
      equipmentTags: ["fc-200"],
    },
    configuration: {
      baseVariant: "35a",
      capabilityTags: [
        "autoflight.fc200",
        "modification.zr-lite",
        "rvsm",
      ],
      modifications: [
        {
          key: "zr-lite",
          state: "installed",
          approvalRef: "ST01468SE",
        },
        {
          key: "aeromech-rvsm",
          state: "installed",
          approvalRef: "ST01531SE",
        },
      ],
      equipment: [
        {
          key: "pitot-static",
          state: "installed",
          model: "Rosemount",
        },
        {
          key: "thrust-reverser",
          state: "not-installed",
        },
      ],
    },
  } as const;

  const result = resolveEffectiveAircraftConfiguration(input);

  assert.equal(result.variantKey, "35a-zr-lite-aeromech");
  assert.equal(result.baseVariantKey, "35a");
  assert.deepEqual(result.equipmentTags, ["fc-200"]);
  assert.deepEqual(result.capabilityTags, [
    "autoflight.fc200",
    "modification.zr-lite",
    "rvsm",
  ]);
  assert.equal(result.modifications.length, 2);
  assert.equal(result.configurationEquipment.length, 2);
  assert.deepEqual(result.dataHealth, []);

  const again = resolveEffectiveAircraftConfiguration(input);
  assert.equal(result.snapshotId, again.snapshotId);
});

test("unknown configuration states surface data-health warnings", () => {
  const result = resolveEffectiveAircraftConfiguration({
    aircraft: { id: "test-aircraft", equipmentTags: [] },
    variantProfile: {
      key: "test-variant",
      displayName: "Test Variant",
      equipmentTags: [],
    },
    configuration: {
      modifications: [
        { key: "unknown-mod", state: "unknown" },
      ],
      equipment: [
        { key: "unknown-equipment", state: "unknown" },
      ],
    },
  });

  assert.deepEqual(
    result.dataHealth.map((issue) => [issue.severity, issue.code]),
    [
      ["warning", "UNKNOWN_MODIFICATION_STATE"],
      ["warning", "UNKNOWN_EQUIPMENT_STATE"],
    ],
  );
});

test("snapshot id changes when technical configuration changes", () => {
  const base = {
    aircraft: { id: "learjet-30", equipmentTags: [] },
    variantProfile: {
      key: "35a-configured",
      displayName: "Learjet 35A configured",
      equipmentTags: ["fc-200"],
    },
    configuration: {
      baseVariant: "35a",
      modifications: [{
        key: "zr-lite",
        state: "installed" as const,
        approvalRef: "ST01468SE",
      }],
      equipment: [{
        key: "pitot-static",
        state: "installed" as const,
        model: "Rosemount",
      }],
    },
  } as const;

  const original = resolveEffectiveAircraftConfiguration(base);
  const changedApproval = resolveEffectiveAircraftConfiguration({
    ...base,
    configuration: {
      ...base.configuration,
      modifications: [{
        ...base.configuration.modifications[0],
        approvalRef: "DIFFERENT-APPROVAL",
      }],
    },
  });
  const changedModel = resolveEffectiveAircraftConfiguration({
    ...base,
    configuration: {
      ...base.configuration,
      equipment: [{
        ...base.configuration.equipment[0],
        model: "Different model",
      }],
    },
  });

  assert.notEqual(original.snapshotId, changedApproval.snapshotId);
  assert.notEqual(original.snapshotId, changedModel.snapshotId);
});
