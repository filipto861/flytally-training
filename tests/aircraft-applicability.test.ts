import assert from "node:assert/strict";
import test from "node:test";

import {
  configurationForVariant,
  filterChecklistForConfiguration,
  filterPerformanceForConfiguration,
  matchesAircraftApplicability,
  resolveSelectedVariant,
  withVariantQuery,
} from "../lib/aircraft-applicability.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";

test("variant selection is validated against aircraft data", () => {
  assert.equal(resolveSelectedVariant("35A", ["35", "35A", "36", "36A"]), "35A");
  assert.equal(resolveSelectedVariant("B737", ["35", "35A"]), undefined);
  assert.equal(resolveSelectedVariant(undefined, ["B23"]), "B23");
  assert.equal(resolveSelectedVariant(undefined, ["35", "35A"]), undefined);
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
