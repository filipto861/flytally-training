import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const uiDir = path.join(root, "components", "performance-ui");
const primitiveNames = [
  "field-row",
  "input-with-unit",
  "source-badge",
  "metric-card",
  "metric-grid",
] as const;

const read = (file: string) => fs.readFileSync(path.join(uiDir, file), "utf8");

test("performance UI primitives remain aircraft-agnostic and phase-agnostic", () => {
  const forbidden = /learjet|bristell|cessna|boeing|rotax|N1|V1|VR|V2|VREF|takeoff|landing/i;
  for (const file of fs.readdirSync(uiDir).filter((name) => /\.(?:tsx|ts|css)$/.test(name))) {
    const source = read(file);
    assert.doesNotMatch(source, forbidden, `${file} must remain generic`);
    assert.doesNotMatch(source, /@\/lib\//, `${file} must not bind to runtime or aircraft data`);
  }
});

test("every performance UI primitive owns a CSS module", () => {
  for (const name of primitiveNames) {
    assert.equal(fs.existsSync(path.join(uiDir, `${name}.tsx`)), true, `${name}.tsx missing`);
    assert.equal(fs.existsSync(path.join(uiDir, `${name}.module.css`)), true, `${name}.module.css missing`);
  }
});

test("performance UI barrel exports every primitive and the pilot consumer uses the shared layer", () => {
  const index = read("index.ts");
  const pilot = fs.readFileSync(path.join(root, "components", "pilot-takeoff-calculator.tsx"), "utf8");
  for (const symbol of ["FieldRow", "InputWithUnit", "SourceBadge", "MetricCard", "MetricGrid"]) {
    assert.match(index, new RegExp(`export \\{ ${symbol} \\}`), `${symbol} export missing`);
    assert.match(pilot, new RegExp(`<${symbol}\\b`), `${symbol} consumer missing`);
  }
  assert.doesNotMatch(index, /aircraft|variant|dataset|calculator binding/i);
  assert.doesNotMatch(pilot, /function Metric\(/);
});
