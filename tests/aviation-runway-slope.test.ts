import assert from "node:assert/strict";
import test from "node:test";

import { calculateRunwaySlope } from "../lib/aviation/runway-slope.ts";

test("B9-C LKPR runway 24 geometry is approximately +0.36 percent uphill", () => {
  const result = calculateRunwaySlope({
    startEndElevationFt: 1158,
    oppositeEndElevationFt: 1202,
    surfaceLengthFt: 12189,
  });
  assert.ok(result);
  assert.ok(Math.abs(result.slopePercent - 0.3609812126) < 1e-9);
  assert.ok(result.slopeDegrees > 0);
});

test("B9-C reverse LKPR runway 06 geometry is approximately -0.36 percent downhill", () => {
  const result = calculateRunwaySlope({
    startEndElevationFt: 1202,
    oppositeEndElevationFt: 1158,
    surfaceLengthFt: 12189,
  });
  assert.ok(result);
  assert.ok(Math.abs(result.slopePercent + 0.3609812126) < 1e-9);
  assert.ok(result.slopeDegrees < 0);
});

test("B9-C equal runway-end elevations are a valid level runway", () => {
  assert.deepEqual(calculateRunwaySlope({
    startEndElevationFt: 1000,
    oppositeEndElevationFt: 1000,
    surfaceLengthFt: 5000,
  }), { slopePercent: 0, slopeDegrees: 0 });
});

test("B9-C missing runway-end elevation fails closed", () => {
  assert.equal(calculateRunwaySlope({
    startEndElevationFt: 1000,
    oppositeEndElevationFt: undefined as unknown as number,
    surfaceLengthFt: 5000,
  }), undefined);
});

test("B9-C non-positive surface length fails closed", () => {
  assert.equal(calculateRunwaySlope({
    startEndElevationFt: 1000,
    oppositeEndElevationFt: 1010,
    surfaceLengthFt: 0,
  }), undefined);
});

test("B9-C non-finite runway-slope inputs fail closed", () => {
  assert.equal(calculateRunwaySlope({
    startEndElevationFt: Number.NaN,
    oppositeEndElevationFt: 1010,
    surfaceLengthFt: 5000,
  }), undefined);
  assert.equal(calculateRunwaySlope({
    startEndElevationFt: 1000,
    oppositeEndElevationFt: Number.POSITIVE_INFINITY,
    surfaceLengthFt: 5000,
  }), undefined);
  assert.equal(calculateRunwaySlope({
    startEndElevationFt: 1000,
    oppositeEndElevationFt: 1010,
    surfaceLengthFt: Number.NEGATIVE_INFINITY,
  }), undefined);
});
