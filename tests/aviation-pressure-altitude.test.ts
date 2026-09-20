import assert from "node:assert/strict";
import test from "node:test";

import {
  altimeterToHpa,
  calculatePressureAltitudeFt,
  hpaToInHg,
  INHG_TO_HPA,
} from "../lib/aviation/pressure-altitude.ts";
import { feetToMeters, metersToFeet } from "../lib/aviation/length-units.ts";

test("B9-A standard pressure leaves field elevation unchanged", () => {
  assert.equal(calculatePressureAltitudeFt(1000, { unit: "hPa", value: 1013.25 }), 1000);
});

test("B9-A pressure altitude follows the approved 30 ft per hPa formula", () => {
  assert.equal(calculatePressureAltitudeFt(1000, { unit: "hPa", value: 1003 }), 1307.5);
});

test("B9-A 29.92 inHg converts consistently without hidden standard-pressure snapping", () => {
  const result = calculatePressureAltitudeFt(1000, { unit: "inHg", value: 29.92 });
  assert.ok(Math.abs(result - 1001.26336) < 0.001);
});

test("B9-A 29.50 inHg pressure altitude uses the same conversion path", () => {
  const result = calculatePressureAltitudeFt(1000, { unit: "inHg", value: 29.50 });
  assert.ok(Math.abs(result - 1427.9485) < 0.001);
});

test("B9-A altimeter conversion uses 33.8639 hPa per inHg and round-trips", () => {
  assert.equal(altimeterToHpa({ unit: "inHg", value: 1 }), INHG_TO_HPA);
  const hpa = 1007.4;
  const roundTrip = altimeterToHpa({ unit: "inHg", value: hpaToInHg(hpa) });
  assert.ok(Math.abs(roundTrip - hpa) < 1e-9);
});

test("B9-A pressure altitude rejects non-positive altimeter settings", () => {
  assert.throws(() => calculatePressureAltitudeFt(1000, { unit: "hPa", value: 0 }), RangeError);
});

test("B9-A generic length conversion helpers round-trip", () => {
  const feet = 5000;
  assert.ok(Math.abs(metersToFeet(feetToMeters(feet)) - feet) < 1e-9);
});
