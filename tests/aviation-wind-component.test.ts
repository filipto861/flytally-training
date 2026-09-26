import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateObservedRunwayWindComponents,
  calculateWindComponents,
} from "../lib/aviation/wind-component.ts";

const near = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

test("B9-C aligned wind resolves entirely as headwind", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 90,
    windSpeedKt: 20,
    runwayHeadingTrueDeg: 90,
  });
  assert.ok(result);
  assert.equal(result.angleOffDeg, 0);
  near(result.headwindKt, 20);
  near(result.crosswindKt, 0);
});

test("B9-C perpendicular wind from the right resolves entirely as crosswind", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 180,
    windSpeedKt: 20,
    runwayHeadingTrueDeg: 90,
  });
  assert.ok(result);
  assert.equal(result.angleOffDeg, 90);
  near(result.headwindKt, 0);
  near(result.crosswindKt, 20);
});

test("B9-C 45 degree wind resolves with cosine and sine components", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 45,
    windSpeedKt: 10,
    runwayHeadingTrueDeg: 0,
  });
  assert.ok(result);
  assert.equal(result.angleOffDeg, 45);
  near(result.headwindKt, Math.cos(Math.PI / 4) * 10);
  near(result.crosswindKt, Math.sin(Math.PI / 4) * 10);
});

test("B9-C wind from the opposite direction is a negative headwind component", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 180,
    windSpeedKt: 12,
    runwayHeadingTrueDeg: 0,
  });
  assert.ok(result);
  assert.equal(result.angleOffDeg, 180);
  near(result.headwindKt, -12);
  near(result.crosswindKt, 0);
});

test("B9-C negative normalized angle preserves left crosswind sign", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 350,
    windSpeedKt: 18,
    runwayHeadingTrueDeg: 10,
  });
  assert.ok(result);
  assert.equal(result.angleOffDeg, 20);
  assert.ok(result.headwindKt > 0);
  assert.ok(result.crosswindKt < 0);
});

test("B9-C gust uses the same wind angle for gust components", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 135,
    windSpeedKt: 10,
    windGustKt: 20,
    runwayHeadingTrueDeg: 90,
  });
  assert.ok(result);
  near(result.headwindKt, Math.cos(Math.PI / 4) * 10);
  near(result.crosswindKt, Math.sin(Math.PI / 4) * 10);
  near(result.gustHeadwindKt ?? NaN, Math.cos(Math.PI / 4) * 20);
  near(result.gustCrosswindKt ?? NaN, Math.sin(Math.PI / 4) * 20);
});

test("B9-C non-finite wind inputs fail closed", () => {
  assert.equal(calculateWindComponents({
    windDirectionTrueDeg: Number.NaN,
    windSpeedKt: 10,
    runwayHeadingTrueDeg: 90,
  }), undefined);
  assert.equal(calculateWindComponents({
    windDirectionTrueDeg: 90,
    windSpeedKt: Number.POSITIVE_INFINITY,
    runwayHeadingTrueDeg: 90,
  }), undefined);
  assert.equal(calculateWindComponents({
    windDirectionTrueDeg: 90,
    windSpeedKt: 10,
    windGustKt: Number.NaN,
    runwayHeadingTrueDeg: 90,
  }), undefined);
  assert.equal(calculateWindComponents({
    windDirectionTrueDeg: 90,
    windSpeedKt: 10,
    runwayHeadingTrueDeg: Number.NEGATIVE_INFINITY,
  }), undefined);
});

test("B9-C zero wind speed produces zero longitudinal and crosswind components", () => {
  const result = calculateWindComponents({
    windDirectionTrueDeg: 270,
    windSpeedKt: 0,
    runwayHeadingTrueDeg: 180,
  });
  assert.ok(result);
  near(result.headwindKt, 0);
  near(result.crosswindKt, 0);
});


test("VRB03KT uses the zero-wind baseline without inventing a direction", () => {
  const result = calculateObservedRunwayWindComponents({
    windDirectionTrueDeg: undefined,
    windSpeedKt: 3,
    windVariable: true,
    windCalm: false,
    runwayHeadingTrueDeg: 243,
  });
  assert.ok(result);
  assert.equal(result.basis, "low-variable-zero-baseline");
  near(result.headwindKt, 0);
  near(result.crosswindKt, 0);
});

test("light variable wind with a gust above 3 kt remains unresolved", () => {
  assert.equal(calculateObservedRunwayWindComponents({
    windDirectionTrueDeg: undefined,
    windSpeedKt: 3,
    windGustKt: 5,
    windVariable: true,
    windCalm: false,
    runwayHeadingTrueDeg: 243,
  }), undefined);
});

test("VRB04KT remains fail-closed because the runway component is not known", () => {
  assert.equal(calculateObservedRunwayWindComponents({
    windDirectionTrueDeg: undefined,
    windSpeedKt: 4,
    windVariable: true,
    windCalm: false,
    runwayHeadingTrueDeg: 243,
  }), undefined);
});

test("observed calm wind resolves to zero without requiring a direction", () => {
  const result = calculateObservedRunwayWindComponents({
    windDirectionTrueDeg: undefined,
    windSpeedKt: 0,
    windVariable: false,
    windCalm: true,
    runwayHeadingTrueDeg: 243,
  });
  assert.ok(result);
  assert.equal(result.basis, "calm");
  near(result.headwindKt, 0);
  near(result.crosswindKt, 0);
});
