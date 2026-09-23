import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import type { ActiveFlight } from "../lib/active-flight/types.ts";
import {
  buildPerformanceContext,
  computeContextHash,
  isContextValid,
} from "../lib/performance/context.ts";
import { computePerformance } from "../lib/performance/client.ts";
import type { PerformanceDataset } from "../lib/universal-aircraft-content.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const activeFlight: ActiveFlight = {
  id: "flight-p2-001",
  aircraftId: "browser-ci-aircraft",
  accountSubject: "local",
  lifecycle: "ACTIVE",
  departure: { icao: "LKPR" },
  destination: { icao: "LOWW" },
  runway: { identifier: "24" },
  weight: { value: 12000, unit: "lb" },
  configuration: { flaps: "8", antiIce: false },
  weather: null,
  performanceDependency: { snapshotId: "afd1:12345678" },
  brief: null,
  createdAt: "2026-09-21T18:00:00.000Z",
  updatedAt: "2026-09-21T18:00:00.000Z",
  activatedAt: "2026-09-21T18:00:00.000Z",
  deactivatedAt: null,
  archivedAt: null,
};

const summaryDataset: PerformanceDataset = {
  id: "p2-test-takeoff-summary",
  title: "P2 test takeoff summary",
  kind: "lookup-table",
  phase: "takeoff",
  axes: [
    { key: "takeoffWeight", label: "Takeoff weight", unit: "lb", values: [12000] },
  ],
  outputs: [
    { key: "n1Percent", label: "N1", unit: "%" },
    { key: "v1", label: "V1", unit: "KIAS" },
    { key: "vr", label: "VR", unit: "KIAS" },
    { key: "v2", label: "V2", unit: "KIAS" },
    { key: "takeoffDistance", label: "Takeoff Distance", unit: "ft" },
  ],
  rows: [
    {
      inputs: { takeoffWeight: 12000 },
      outputs: {
        n1Percent: 94,
        v1: 110,
        vr: 115,
        v2: 125,
        takeoffDistance: 3100,
      },
    },
  ],
  interpolation: "none",
  calculator: {
    kind: "multi-axis-metric-grid",
    operation: "takeoff",
    inputAxes: ["takeoffWeight"],
    outputKeys: ["n1Percent", "v1", "vr", "v2", "takeoffDistance"],
  },
};

test("P2 builds the performance context from the Active Flight dependency snapshot", () => {
  assert.deepEqual(buildPerformanceContext(activeFlight), {
    activeFlightId: "flight-p2-001",
    aircraftId: "browser-ci-aircraft",
    dependencySnapshotId: "afd1:12345678",
    weight: { value: 12000, unit: "lb" },
    runway: { identifier: "24", airportIcao: "LKPR" },
    configuration: { flaps: "8", antiIce: false },
    weather: null,
  });
});

test("P2 performance context hash is deterministic", () => {
  const context = buildPerformanceContext(activeFlight);
  assert.ok(context);
  const first = computeContextHash(context);
  assert.equal(computeContextHash(context), first);
  assert.match(first, /^p2:[0-9a-f]{8}$/);
});

test("P2 context validity accepts matching dependencies and rejects changed weight", () => {
  const stored = buildPerformanceContext(activeFlight);
  const same = buildPerformanceContext({ ...activeFlight });
  const changed = buildPerformanceContext({
    ...activeFlight,
    weight: { value: 13000, unit: "lb" },
    performanceDependency: { snapshotId: "afd1:87654321" },
  });

  assert.ok(stored);
  assert.ok(same);
  assert.ok(changed);
  assert.equal(isContextValid(same, stored), true);
  assert.equal(isContextValid(changed, stored), false);
});

test("P2 data strip styling uses frozen workspace tokens without hardcoded colors", () => {
  const css = read("components/ft-performance/ft-performance.module.css");

  for (const token of [
    "--ft-bg-shell",
    "--ft-bg-panel",
    "--ft-bg-inset",
    "--ft-bg-operational",
    "--ft-text-primary",
    "--ft-text-secondary",
    "--ft-text-metadata",
    "--ft-state-recalc",
    "--ft-state-recalc-bg",
    "--ft-font-data",
    "--ft-space-3",
    "--ft-space-4",
    "--ft-space-5",
    "--ft-space-6",
    "--ft-touch-target-min",
    "--ft-rule-default",
    "--ft-rule-strong",
  ]) {
    assert.match(css, new RegExp(`var\\(${token.replaceAll("-", "\\-")}\\)`));
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
});

test("P2 takeoff result preserves Round 3.7 N1 V1 VR V2 Distance semantics without VREF", () => {
  const context = buildPerformanceContext(activeFlight);
  assert.ok(context);
  const result = computePerformance(
    context,
    [summaryDataset],
    undefined,
    {},
    "2026-09-21T19:00:00.000Z",
  );

  for (const key of ["n1", "v1", "vr", "v2", "takeoffDistance"] as const) {
    assert.equal(result[key].status, "ready");
  }
  assert.equal("vref" in result, false);

  const strip = read("components/ft-performance/FtPerformanceStrip.tsx");
  assert.match(strip, /label: "N1"/);
  assert.match(strip, /label: "V1"/);
  assert.match(strip, /label: "VR"/);
  assert.match(strip, /label: "V2"/);
  assert.match(strip, /label: "Takeoff Distance"/);
  assert.doesNotMatch(strip, /VREF/i);
});

test("P2 presentation contains no hardcoded takeoff result constants", () => {
  const sources = [
    read("lib/performance/context.ts"),
    read("lib/performance/client.ts"),
    read("components/ft-performance/FtPerformanceStrip.tsx"),
    read("components/ft-performance/FtPerformancePresentation.tsx"),
  ].join("\n");

  assert.doesNotMatch(sources, /\b(?:n1|v1|vr|v2|takeoffDistance)\s*:\s*\d+(?:\.\d+)?\b/i);
  assert.doesNotMatch(sources, /\b96\.4\b/);
});

test("P2 wraps existing performance runtime without importing presentation into frozen runtime files", () => {
  const wrapper = read("lib/performance/client.ts");
  assert.match(wrapper, /calculatePilotTakeoffSummary/);
  assert.match(wrapper, /calculateMultiAxisMetricGrid/);

  for (const file of [
    "lib/performance-calculator.ts",
    "lib/performance-runtime.ts",
    "lib/pilot-takeoff-calculator.ts",
    "lib/pilot-landing-calculator.ts",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /ft-performance|FlightPerformanceContext|PerformanceResult/);
  }
});

test("P2 uses one context-label vocabulary across training, Flight Brief and operational entry points", () => {
  const label = read("components/ft-performance/FtPerformanceContextLabel.tsx");
  const page = read("components/ft-performance/FtPerformancePage.tsx");
  const brief = read("components/ft-flight/FtFlightBrief.tsx");
  const fastPath = read("components/ft-fast-path/FtFastPathPanel.tsx");

  assert.match(label, /training: "Training view"/);
  assert.match(label, /brief: "Flight brief"/);
  assert.match(label, /operational: "Operational"/);
  assert.match(page, /view="training"/);
  assert.match(brief, /view="brief"/);
  assert.match(fastPath, /view="operational"/);
});
