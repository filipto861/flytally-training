import assert from "node:assert/strict";
import test from "node:test";

import {
  aircraftApplicabilityRegistryProfileKey,
  commonAircraftEquipmentProfileKey,
  isSelectableAircraftVariantProfileKey,
  parseAircraftConfigurationMetadata,
} from "../lib/aircraft-configuration-profile.ts";

test("configuration metadata parser accepts and normalizes a complex profile", () => {
  const result = parseAircraftConfigurationMetadata({
    serialNumber: " 35-113 ",
    baseVariant: " 35a ",
    capabilityTags: ["rvsm", "rvsm", "autoflight.fc200"],
    modifications: [{
      key: " zr-lite ",
      state: "installed",
      approvalRef: " ST01468SE ",
    }],
    equipment: [{
      key: " pitot-static ",
      state: "installed",
      model: " Rosemount ",
    }],
  });

  assert.deepEqual(result, {
    serialNumber: "35-113",
    baseVariant: "35a",
    capabilityTags: ["rvsm", "autoflight.fc200"],
    modifications: [{
      key: "zr-lite",
      state: "installed",
      approvalRef: "ST01468SE",
    }],
    equipment: [{
      key: "pitot-static",
      state: "installed",
      model: "Rosemount",
    }],
  });
});

test("absent structured configuration remains absent for legacy profiles", () => {
  assert.equal(
    parseAircraftConfigurationMetadata(undefined),
    undefined,
  );
});

test("configuration metadata parser rejects invalid installation states", () => {
  assert.throws(
    () => parseAircraftConfigurationMetadata({
      modifications: [{
        key: "zr-lite",
        state: "maybe",
      }],
    }),
    /configuration modification state/i,
  );
});

test("configuration metadata parser rejects duplicate modification keys", () => {
  assert.throws(
    () => parseAircraftConfigurationMetadata({
      modifications: [
        { key: "zr-lite", state: "installed" },
        { key: "zr-lite", state: "unknown" },
      ],
    }),
    /duplicate configuration modification key/i,
  );
});

test("configuration metadata parser rejects unknown fields", () => {
  assert.throws(
    () => parseAircraftConfigurationMetadata({
      baseVarient: "35a",
    }),
    /unsupported aircraft configuration metadata field/i,
  );
});

test("configuration metadata parser accepts an exact manufacturer serial identifier without interpreting it", () => {
  assert.deepEqual(
    parseAircraftConfigurationMetadata({ serialNumber: " SN A-001/REV2 " }),
    { serialNumber: "SN A-001/REV2" },
  );
});


test("reserved configuration profiles never become learner-selectable variants", () => {
  assert.equal(
    isSelectableAircraftVariantProfileKey(commonAircraftEquipmentProfileKey),
    false,
  );
  assert.equal(
    isSelectableAircraftVariantProfileKey(aircraftApplicabilityRegistryProfileKey),
    false,
  );
  assert.equal(isSelectableAircraftVariantProfileKey("fc530-standard"), true);
});
