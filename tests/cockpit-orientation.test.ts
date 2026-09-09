import assert from "node:assert/strict";
import test from "node:test";

import {
  getCockpitLocationForChecklistItem,
  getCockpitOrientation,
  learjet3536CockpitOrientation,
} from "../lib/cockpit-orientation.ts";

test("Learjet cockpit orientation exposes the verified region model", () => {
  const orientation = getCockpitOrientation("learjet-35-36");
  assert.ok(orientation);
  assert.equal(orientation.regions.length, 5);
  assert.ok(orientation.controls.length >= 5);
});

test("engine start switch maps to the center switch panel", () => {
  const location = getCockpitLocationForChecklistItem("learjet-35-36", "start-switch");
  assert.equal(location?.id, "generator-start-switches");
  assert.equal(location?.regionId, "center-switch");
  assert.equal(location?.source.manualPage, "2-5");
});

test("engine start monitoring maps to the center instrument panel", () => {
  const location = getCockpitLocationForChecklistItem("learjet-35-36", "monitor-start");
  assert.equal(location?.id, "engine-instruments");
  assert.equal(location?.regionId, "center-instrument");
  assert.equal(location?.source.manualPage, "7-21");
});

test("unsupported cockpit locations are not invented", () => {
  assert.equal(getCockpitLocationForChecklistItem("learjet-35-36", "batteries-on"), undefined);
  assert.equal(getCockpitLocationForChecklistItem("learjet-35-36", "pressurization-setup"), undefined);
});

test("a checklist item maps to at most one cockpit control", () => {
  const mapped = learjet3536CockpitOrientation.controls.flatMap((control) => control.checklistItemIds);
  assert.equal(new Set(mapped).size, mapped.length);
});
