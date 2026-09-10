import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { trainingActivityKinds } from "../lib/progress-events.ts";

const explorer = fs.readFileSync(new URL("../components/cockpit-orientation-explorer.tsx", import.meta.url), "utf8");
const orientationPage = fs.readFileSync(new URL("../app/aircraft/[aircraftId]/orientation/page.tsx", import.meta.url), "utf8");

test("generic cockpit explorer contains no Learjet-specific source or default panel", () => {
  assert.doesNotMatch(explorer, /Learjet|FlightSafety/i);
  assert.doesNotMatch(explorer, /\?\?\s*"center-switch"/);
  assert.match(explorer, /orientation\.regions\[0\]\?\.id/);
  assert.match(explorer, /Controlled source/);
});

test("orientation region IDs do not have to correspond to a CSS module key", () => {
  assert.match(explorer, /styles\[region\.id\]\s*\?\?\s*""/);
});

test("cockpit orientation is a measurable aircraft learning activity", () => {
  assert.ok(trainingActivityKinds.includes("orientation"));
  assert.match(orientationPage, /kind="orientation"/);
  assert.match(orientationPage, /contentId="cockpit-orientation"/);
});
