import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  assertApplicabilityBaseVariantsRegistered,
  assertApplicabilityCapabilitiesRegistered,
  assertApplicabilityConfigurationEquipmentRegistered,
  assertApplicabilityModificationsRegistered,
  assertApplicabilityVariantsRegistered,
  collectEmbeddedBaseVariantKeys,
  collectEmbeddedCapabilityTags,
  collectEmbeddedConfigurationEquipmentKeys,
  collectEmbeddedModificationKeys,
  collectEmbeddedVariantKeys,
} from "../lib/content-applicability-binding.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";

test("M43 collects variant applicability across nested and top-level content", () => {
  const payload = {
    applicability: { variants: ["sn-001"] },
    groups: [
      { items: [{ applicability: { variants: ["sn-002", "sn-001"] } }] },
    ],
    variants: ["not-an-applicability-reference"],
  };

  assert.deepEqual([...collectEmbeddedVariantKeys(payload)].sort(), ["sn-001", "sn-002"]);
});

test("M43 accepts only registered applicability variants", () => {
  const payload = {
    datasets: [
      { applicability: { variants: ["common", "sn-809"] } },
    ],
  };

  assert.doesNotThrow(() => assertApplicabilityVariantsRegistered(payload, ["common", "sn-809"], "test-aircraft"));
  assert.throws(
    () => assertApplicabilityVariantsRegistered(payload, ["common"], "test-aircraft"),
    /unregistered variant\(s\).*test-aircraft.*sn-809/i,
  );
});

test("M43 leaves non-variant-scoped payloads compatible with sparse aircraft", () => {
  assert.doesNotThrow(() => assertApplicabilityVariantsRegistered({ title: "Generic" }, [], "generic-aircraft"));
});

test("M43 approval/publication governance invokes the applicability integrity gate", () => {
  const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
  assert.match(governance, /assertEmbeddedApplicabilityMatchesAircraft/);
  assert.match(governance, /await assertEmbeddedApplicabilityMatchesAircraft\(version\.aircraftId, version\.payload\)/);
});


test("M1-D2 collects complex applicability identifiers only from applicability blocks", () => {
  const payload = {
    modificationsAllOf: ["not-an-applicability-reference"],
    items: [{
      applicability: {
        baseVariants: ["35a"],
        capabilityTagsAllOf: ["rvsm"],
        modificationsAllOf: ["zr-lite"],
        configurationEquipmentAnyOf: ["fc-200", "alternate-ap"],
      },
    }],
  };

  assert.deepEqual(collectEmbeddedBaseVariantKeys(payload), ["35a"]);
  assert.deepEqual(collectEmbeddedCapabilityTags(payload), ["rvsm"]);
  assert.deepEqual(collectEmbeddedModificationKeys(payload), ["zr-lite"]);
  assert.deepEqual(
    collectEmbeddedConfigurationEquipmentKeys(payload),
    ["fc-200", "alternate-ap"],
  );
});

test("M1-D2 accepts only aircraft-registered complex applicability identifiers", () => {
  const payload = {
    applicability: {
      baseVariants: ["35a"],
      capabilityTagsAllOf: ["rvsm"],
      modificationsAllOf: ["zr-lite"],
      configurationEquipmentAllOf: ["fc-200"],
    },
  };

  assert.doesNotThrow(() =>
    assertApplicabilityBaseVariantsRegistered(payload, ["35a"], "test-aircraft"),
  );
  assert.doesNotThrow(() =>
    assertApplicabilityCapabilitiesRegistered(payload, ["rvsm"], "test-aircraft"),
  );
  assert.doesNotThrow(() =>
    assertApplicabilityModificationsRegistered(payload, ["zr-lite"], "test-aircraft"),
  );
  assert.doesNotThrow(() =>
    assertApplicabilityConfigurationEquipmentRegistered(payload, ["fc-200"], "test-aircraft"),
  );

  assert.throws(
    () => assertApplicabilityModificationsRegistered(payload, [], "test-aircraft"),
    /unregistered modification\(s\).*test-aircraft.*zr-lite/i,
  );
});

test("M1-D2 publication validation rejects malformed complex applicability arrays", () => {
  const malformed = {
    aircraftId: "generic-aircraft",
    title: "Procedures",
    procedures: [{
      id: "test",
      title: "Test",
      applicability: {
        modificationsAllOf: [],
      },
      steps: [{
        id: "step",
        action: "Action",
      }],
    }],
  };

  assert.match(
    validateContentPayload("procedures", malformed, "generic-aircraft").join("\n"),
    /applicability\.modificationsAllOf/,
  );
});

test("M1-D2 governance validates every structured configuration namespace", () => {
  const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
  assert.match(governance, /parseAircraftConfigurationMetadata\(metadata\.configuration\)/);
  assert.match(governance, /assertApplicabilityBaseVariantsRegistered/);
  assert.match(governance, /assertApplicabilityCapabilitiesRegistered/);
  assert.match(governance, /assertApplicabilityModificationsRegistered/);
  assert.match(governance, /assertApplicabilityConfigurationEquipmentRegistered/);
});

test("M1-D3 registration traversal includes identifiers nested inside applicability anyOf branches", () => {
  const payload = {
    items: [{
      applicability: {
        anyOf: [
          { serialNumberRanges: [{ prefix: "35-", from: 202 }] },
          { modificationsAllOf: ["amk-78-13"] },
          { configurationEquipmentAllOf: ["thrust-reverser-aeronca"] },
        ],
      },
    }],
  };

  assert.deepEqual(collectEmbeddedModificationKeys(payload), ["amk-78-13"]);
  assert.deepEqual(
    collectEmbeddedConfigurationEquipmentKeys(payload),
    ["thrust-reverser-aeronca"],
  );
  assert.doesNotThrow(() =>
    assertApplicabilityModificationsRegistered(
      payload,
      ["amk-78-13"],
      "generic-aircraft",
    ),
  );
  assert.throws(
    () =>
      assertApplicabilityConfigurationEquipmentRegistered(
        payload,
        [],
        "generic-aircraft",
      ),
    /unregistered configuration equipment identifier/i,
  );
});


test("M1-D4 governed applicability can use a reserved vocabulary without exposing a learner variant", () => {
  const governance = fs.readFileSync(
    new URL("../lib/content-governance.ts", import.meta.url),
    "utf8",
  );
  const repository = fs.readFileSync(
    new URL("../lib/postgres-content-repository.ts", import.meta.url),
    "utf8",
  );

  assert.match(governance, /aircraftApplicabilityRegistryProfileKey/);
  assert.match(governance, /registry\.modificationKeys/);
  assert.match(governance, /registry\.configurationEquipmentKeys/);
  assert.match(repository, /isSelectableAircraftVariantProfileKey/);
});
