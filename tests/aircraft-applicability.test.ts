import assert from "node:assert/strict";
import test from "node:test";

import {
  configurationForAircraftVariant,
  configurationForVariant,
  filterAbnormalEmergencyForConfiguration,
  filterChecklistForConfiguration,
  filterPerformanceForConfiguration,
  matchesAircraftApplicability,
  resolveSelectedVariant,
  resolveVariantProfile,
  withVariantQuery,
} from "../lib/aircraft-applicability.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";

test("variant selection is validated against aircraft data", () => {
  assert.equal(resolveSelectedVariant("35A", ["35", "35A", "36", "36A"]), "35A");
  assert.equal(resolveSelectedVariant("B737", ["35", "35A"]), undefined);
  assert.equal(resolveSelectedVariant(undefined, ["B23"]), "B23");
  assert.equal(resolveSelectedVariant(undefined, ["35", "35A"]), undefined);
});

test("persisted variant profiles resolve explicit equipment without inferring from model names", () => {
  const aircraft = {
    variants: ["A", "B"],
    variantProfiles: [
      { key: "A", displayName: "Variant A", equipmentTags: [] },
      { key: "B", displayName: "Variant B / configured", equipmentTags: ["option-x", "autopilot"], note: "Verified installation profile." },
    ],
  } as const;

  assert.equal(resolveVariantProfile(aircraft, "B")?.displayName, "Variant B / configured");
  assert.deepEqual([...configurationForAircraftVariant(aircraft, "B").equipment], ["option-x", "autopilot"]);
  assert.equal(matchesAircraftApplicability({ equipmentAllOf: ["option-x"] }, configurationForAircraftVariant(aircraft, "B")), true);
  assert.equal(matchesAircraftApplicability({ equipmentAllOf: ["option-x"] }, configurationForAircraftVariant(aircraft, "A")), false);

  const legacyOnly = { variants: ["35A"] } as const;
  assert.deepEqual([...configurationForAircraftVariant(legacyOnly, "35A").equipment], []);
  assert.equal(matchesAircraftApplicability({ equipmentAllOf: ["aak-80-2"] }, configurationForAircraftVariant(legacyOnly, "35A")), false);
});

test("applicability fails closed when a required variant or equipment tag is unknown", () => {
  const unselected = configurationForVariant(undefined);
  assert.equal(matchesAircraftApplicability({ variants: ["35A"] }, unselected), false);
  assert.equal(matchesAircraftApplicability({ equipmentAllOf: ["autopilot"] }, unselected), false);
  assert.equal(matchesAircraftApplicability({ equipmentAnyOf: ["g1000", "gns"] }, unselected), false);
  assert.equal(matchesAircraftApplicability({ equipmentNoneOf: ["reverser"] }, unselected), true);

  const configured = configurationForVariant("35A", ["autopilot", "g1000"]);
  assert.equal(matchesAircraftApplicability({ variants: ["35", "35A"], equipmentAllOf: ["autopilot"], equipmentAnyOf: ["g1000", "gns"], equipmentNoneOf: ["reverser"] }, configured), true);
});

test("configuration filters are driven only by payload applicability", () => {
  const content = {
    aircraftId: "generic-aircraft",
    title: "Normal checklists",
    phases: [{
      id: "before-start",
      title: "Before Start",
      sequence: 10,
      items: [
        { id: "common", challenge: "Common item" },
        { id: "variant", challenge: "Variant item", applicability: { variants: ["B"] } },
        { id: "equipment", challenge: "Equipment item", applicability: { equipmentAllOf: ["option-x"] } },
      ],
    }],
  } as const;

  const variantA = filterChecklistForConfiguration(content, configurationForVariant("A"));
  assert.deepEqual(variantA.phases[0].items.map((item) => item.id), ["common"]);

  const variantB = filterChecklistForConfiguration(content, configurationForVariant("B", ["option-x"]));
  assert.deepEqual(variantB.phases[0].items.map((item) => item.id), ["common", "variant", "equipment"]);
});

test("performance dataset applicability is independent of aircraft-specific code", () => {
  const content = {
    aircraftId: "generic-aircraft",
    title: "Performance",
    datasets: [
      { id: "common", title: "Common", kind: "reference-table", axes: [], outputs: [{ key: "x", label: "X" }], rows: [{ inputs: {}, outputs: { x: 1 } }], interpolation: "none" },
      { id: "variant-b", title: "Variant B", kind: "reference-table", axes: [], outputs: [{ key: "x", label: "X" }], rows: [{ inputs: {}, outputs: { x: 2 } }], interpolation: "none", applicability: { variants: ["B"] } },
    ],
  } as const;

  assert.deepEqual(filterPerformanceForConfiguration(content, configurationForVariant("A")).datasets.map((item) => item.id), ["common"]);
  assert.deepEqual(filterPerformanceForConfiguration(content, configurationForVariant("B")).datasets.map((item) => item.id), ["common", "variant-b"]);
});

test("abnormal scenarios and individual stages use the same persisted equipment applicability", () => {
  const source = [{ manualId: "manual", pageLabel: "1" }] as const;
  const content = {
    aircraftId: "generic-aircraft",
    title: "Abnormal",
    scenarios: [
      {
        id: "common",
        title: "Common scenario",
        category: "General",
        phase: "Any",
        difficulty: "core",
        minutes: 2,
        summary: "Common",
        setup: "Condition",
        objectives: ["Recognize"],
        debrief: ["Review"],
        stages: [
          { id: "recognize", label: "Recognize", prompt: "What happened?", expectedResponse: ["Identify"], explanation: "Source-backed.", sources: source },
          { id: "option", label: "Installed option", prompt: "What next?", expectedResponse: ["Use option"], explanation: "Only when installed.", applicability: { equipmentAllOf: ["option-x"] }, sources: source },
        ],
      },
      {
        id: "configured",
        title: "Configured scenario",
        category: "General",
        phase: "Any",
        difficulty: "advanced",
        minutes: 2,
        summary: "Configured",
        setup: "Condition",
        objectives: ["Respond"],
        debrief: ["Review"],
        applicability: { variants: ["B"] },
        stages: [{ id: "act", label: "Act", prompt: "Action?", expectedResponse: ["Act"], explanation: "Source-backed.", sources: source }],
      },
    ],
  } as const;

  const variantA = filterAbnormalEmergencyForConfiguration(content, configurationForVariant("A"));
  assert.deepEqual(variantA.scenarios.map((scenario) => scenario.id), ["common"]);
  assert.deepEqual(variantA.scenarios[0].stages.map((stage) => stage.id), ["recognize"]);

  const variantB = filterAbnormalEmergencyForConfiguration(content, configurationForVariant("B", ["option-x"]));
  assert.deepEqual(variantB.scenarios.map((scenario) => scenario.id), ["common", "configured"]);
  assert.deepEqual(variantB.scenarios[0].stages.map((stage) => stage.id), ["recognize", "option"]);
});

test("publication validation rejects malformed applicability metadata", () => {
  const malformed = {
    aircraftId: "generic-aircraft",
    title: "Normal checklists",
    phases: [{
      id: "before-start",
      title: "Before Start",
      sequence: 10,
      items: [{ id: "battery", challenge: "Battery", applicability: { variants: [] } }],
    }],
  };
  assert.match(validateContentPayload("checklists", malformed, "generic-aircraft").join("\n"), /applicability\.variants/);
});

test("variant context can be carried across module links", () => {
  assert.equal(withVariantQuery("/aircraft/x/performance", undefined), "/aircraft/x/performance");
  assert.equal(withVariantQuery("/aircraft/x/performance", "35A"), "/aircraft/x/performance?variant=35A");
  assert.equal(withVariantQuery("/aircraft/x/performance?mode=training", "35A"), "/aircraft/x/performance?mode=training&variant=35A");
});
