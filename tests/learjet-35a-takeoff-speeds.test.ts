import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

type SpeedCase = {
  readonly file: string;
  readonly outputKey: "vr" | "v2";
  readonly exactWeight: number;
  readonly exactValue: number;
  readonly interpolationWeight: number;
  readonly interpolationValue: number;
};

const cases: readonly SpeedCase[] = [
  {
    file: "vr-flaps8.json",
    outputKey: "vr",
    exactWeight: 15000,
    exactValue: 130,
    interpolationWeight: 15500,
    interpolationValue: 132,
  },
  {
    file: "v2-flaps8.json",
    outputKey: "v2",
    exactWeight: 15000,
    exactValue: 133,
    interpolationWeight: 15500,
    interpolationValue: 135,
  },
  {
    file: "vr-flaps20.json",
    outputKey: "vr",
    exactWeight: 15000,
    exactValue: 127,
    interpolationWeight: 15500,
    interpolationValue: 128.5,
  },
  {
    file: "v2-flaps20.json",
    outputKey: "v2",
    exactWeight: 15000,
    exactValue: 126,
    interpolationWeight: 15500,
    interpolationValue: 128,
  },
];

const load = (file: string): PerformanceDataset => JSON.parse(
  fs.readFileSync(
    new URL(`../aircraft-data/learjet-35a/performance/${file}`, import.meta.url),
    "utf8",
  ),
) as PerformanceDataset;

const resultValue = (
  dataset: PerformanceDataset,
  grossWeight: number,
  outputKey: "vr" | "v2",
): { readonly status: string; readonly method?: string; readonly value?: number; readonly reason?: string } => {
  const calculation = calculateMultiAxisMetricGrid(dataset, { grossWeight });
  const value = calculation.metrics?.find((metric) => metric.key === outputKey)?.value;
  return {
    status: calculation.status,
    method: calculation.method,
    value: typeof value === "number" ? value : undefined,
    reason: calculation.reason,
  };
};

test("B4 Learjet VR/V2 datasets satisfy the governed multi-axis metric-grid contract", () => {
  for (const sourceCase of cases) {
    const dataset = load(sourceCase.file);
    const errors = validateContentPayload(
      "performance",
      { aircraftId: "learjet-35a", title: "Learjet 35A Performance", datasets: [dataset] },
      "learjet-35a",
    );
    assert.deepEqual(errors, [], sourceCase.file);
    assert.equal(dataset.calculator?.kind, "multi-axis-metric-grid");
    if (dataset.calculator?.kind === "multi-axis-metric-grid") {
      assert.deepEqual(dataset.calculator.inputAxes, ["grossWeight"]);
      assert.deepEqual(dataset.calculator.outputKeys, [sourceCase.outputKey]);
    }
  }
});

test("B4 Learjet VR/V2 datasets return exact published source rows", () => {
  for (const sourceCase of cases) {
    const result = resultValue(load(sourceCase.file), sourceCase.exactWeight, sourceCase.outputKey);
    assert.equal(result.status, "ready", sourceCase.file);
    assert.equal(result.method, "exact-source-row", sourceCase.file);
    assert.equal(result.value, sourceCase.exactValue, sourceCase.file);
  }
});

test("B4 Learjet VR/V2 datasets perform bounded interpolation between published weights", () => {
  for (const sourceCase of cases) {
    const result = resultValue(load(sourceCase.file), sourceCase.interpolationWeight, sourceCase.outputKey);
    assert.equal(result.status, "ready", sourceCase.file);
    assert.equal(result.method, "bounded-linear-interpolation", sourceCase.file);
    assert.equal(result.value, sourceCase.interpolationValue, sourceCase.file);
  }
});

test("B4 Learjet VR/V2 datasets fail closed outside the published weight envelope", () => {
  for (const sourceCase of cases) {
    for (const grossWeight of [9999, 18301]) {
      const result = resultValue(load(sourceCase.file), grossWeight, sourceCase.outputKey);
      assert.equal(result.status, "unsupported", `${sourceCase.file} @ ${grossWeight}`);
      assert.equal(result.value, undefined, `${sourceCase.file} @ ${grossWeight}`);
      assert.match(result.reason ?? "", /will not extrapolate/i, `${sourceCase.file} @ ${grossWeight}`);
    }
  }
});

test("B4 reproduces the FlightSafety AFM worked example for Flaps 8 at 15,000 lb", () => {
  const vr = resultValue(load("vr-flaps8.json"), 15000, "vr");
  const v2 = resultValue(load("v2-flaps8.json"), 15000, "v2");

  assert.equal(vr.status, "ready");
  assert.equal(vr.method, "exact-source-row");
  assert.equal(vr.value, 130);

  assert.equal(v2.status, "ready");
  assert.equal(v2.method, "exact-source-row");
  assert.equal(v2.value, 133);
});
