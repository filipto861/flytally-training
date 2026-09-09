import assert from "node:assert/strict";
import test from "node:test";

import {
  aircraftWorkspaceHref,
  aircraftWorkspaceSections,
  isAircraftWorkspaceSection,
} from "../lib/product-navigation.ts";

test("v1.0 product shell exposes the six canonical aircraft surfaces", () => {
  assert.deepEqual(
    aircraftWorkspaceSections.map((section) => section.label),
    ["Aircraft", "Learn", "Checklist", "Practice", "Reference", "Progress"],
  );
  assert.equal(new Set(aircraftWorkspaceSections.map((section) => section.key)).size, 6);
});

test("aircraft workspace links stay scoped to the selected aircraft", () => {
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "overview"), "/aircraft/learjet-35-36");
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "learn"), "/aircraft/learjet-35-36/learn");
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "checklist"), "/aircraft/learjet-35-36/checklist");
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "practice"), "/aircraft/learjet-35-36/practice");
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "reference"), "/aircraft/learjet-35-36/reference");
  assert.equal(aircraftWorkspaceHref("learjet-35-36", "progress"), "/aircraft/learjet-35-36/progress");
});

test("unknown workspace sections are rejected", () => {
  assert.equal(isAircraftWorkspaceSection("practice"), true);
  assert.equal(isAircraftWorkspaceSection("cold-dark"), false);
  assert.equal(isAircraftWorkspaceSection("admin"), false);
});
