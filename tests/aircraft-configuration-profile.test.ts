import assert from "node:assert/strict";
import test from "node:test";

import {
  parseAircraftConfigurationMetadata,
} from "../lib/aircraft-configuration-profile.ts";

test("configuration metadata parser accepts and normalizes a complex profile", () => {
  const result = parseAircraftConfigurationMetadata({
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
