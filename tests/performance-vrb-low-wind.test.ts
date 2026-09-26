import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("performance operation resolves observed runway wind through the shared VRB policy", () => {
  const takeoff = read("components/ft-performance/use-performance-operation.ts");
  const landing = read("components/ft-performance/use-landing-performance-operation.ts");

  assert.match(takeoff, /calculateObservedRunwayWindComponents/);
  assert.match(landing, /calculateObservedRunwayWindComponents/);
  assert.doesNotMatch(
    takeoff,
    /observation\.windDirectionTrueDeg === undefined\) return undefined/,
  );
});

test("environment context tells the pilot when VRB03KT uses a zero-wind baseline", () => {
  const panel = read("components/environment-context-panel.tsx");

  assert.match(panel, /low-variable-zero-baseline/);
  assert.match(panel, /zero-wind baseline used/);
});
