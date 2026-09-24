import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";
import { calculateMultiAxisMetricGrid } from "../lib/performance-calculator.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const dataset = JSON.parse(
  fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/takeoff-n1-aeronca.json", import.meta.url),
    "utf8",
  ),
) as PerformanceDataset;

const calculate = (oatC: number, pressureAltitudeFt: number) =>
  calculateMultiAxisMetricGrid(dataset, { oatC, pressureAltitudeFt });

const n1 = (oatC: number, pressureAltitudeFt: number): number => {
  const result = calculate(oatC, pressureAltitudeFt);
  assert.equal(result.status, "ready");
  const value = result.metrics?.find((metric) => metric.key === "n1Percent")?.value;
  assert.equal(typeof value, "number");
  return value as number;
};

test("PP.3 Aeronca full-rated N1 dataset satisfies the governed metric-grid contract", () => {
  const errors = validateContentPayload(
    "performance",
    {
      aircraftId: "learjet-35a",
      title: "Learjet 35A Performance",
      datasets: [dataset],
    },
    "learjet-35a",
  );
  assert.deepEqual(errors, []);
  assert.equal(dataset.id, "learjet-35a-takeoff-n1-aeronca-anti-ice-off");
  assert.equal(dataset.rows.length, 309);
});

test("PP.3 Aeronca full-rated N1 preserves exact P-5.1 nodes", () => {
  assert.equal(n1(16, 0), 94.5);
  assert.equal(n1(16, 1000), 95.5);
  assert.equal(n1(16, 2000), 96.4);
  assert.equal(n1(27, 10000), 94.0);
  assert.equal(n1(-15, 6000), 95.1);
});

test("PP.3 Aeronca full-rated N1 remains configuration-distinct from standard-nozzle data", () => {
  const standard = JSON.parse(
    fs.readFileSync(
      new URL("../aircraft-data/learjet-35a/performance/takeoff-n1.json", import.meta.url),
      "utf8",
    ),
  ) as PerformanceDataset;

  const standardResult = calculateMultiAxisMetricGrid(standard, {
    oatC: 16,
    pressureAltitudeFt: 0,
  });
  assert.equal(standardResult.status, "ready");
  const standardN1 = standardResult.metrics?.find(
    (metric) => metric.key === "n1Percent",
  )?.value;

  assert.equal(standardN1, 96.3);
  assert.equal(n1(16, 0), 94.5);
  assert.notEqual(standardN1, n1(16, 0));
});

test("PP.3 Aeronca full-rated N1 uses bounded interpolation only inside complete source rectangles", () => {
  const result = calculate(17, 1500);
  assert.equal(result.status, "ready");
  assert.equal(result.method, "bounded-linear-interpolation");
  assert.ok(Math.abs(n1(17, 1500) - 95.925) < 1e-9);
});

test("PP.3 Aeronca high-temperature sparse regions remain fail-closed", () => {
  assert.equal(calculate(49, 1000).status, "ready");
  assert.equal(calculate(49, 2000).status, "unsupported");
  assert.equal(calculate(43, 4000).status, "ready");
  assert.equal(calculate(43, 5000).status, "unsupported");
});

test("PP.3 Aeronca fractional source altitude caps are not silently extrapolated", () => {
  // P-5.1 annotates 49°C/120°F with a 1,700 ft maximum altitude. The current
  // grid intentionally materializes only explicit 1,000-ft nodes, so 1,500 ft
  // remains unsupported rather than inventing a fractional-cap row.
  assert.equal(calculate(49, 1500).status, "unsupported");
});

test("PP.3 Aeronca full-rated N1 never extrapolates outside the published axes", () => {
  assert.equal(calculate(53, 0).status, "unsupported");
  assert.equal(calculate(16, 11000).status, "unsupported");
});

test("PP.3 bundled Learjet package registers Aeronca N1 without rebinding existing full-rated calculator", () => {
  const pkg = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const definition = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts", import.meta.url),
    "utf8",
  );

  assert.match(pkg, /takeoff-n1-aeronca\.json/);
  assert.match(pkg, /takeoffN1Aeronca/);
  assert.doesNotMatch(definition, /takeoff-n1-aeronca/);
});
