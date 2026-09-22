import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX3 removes legacy light-palette islands from procedure execution and scenario training", () => {
  for (const path of [
    "components/procedure-browser.module.css",
    "components/scenario-trainer.module.css",
  ]) {
    const css = read(path);
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
    assert.match(css, /var\(--ft-bg-panel\)/);
    assert.match(css, /var\(--ft-bg-inset\)/);
    assert.match(css, /var\(--ft-text-primary\)/);
  }
});

test("UX3 keeps source warning caution and note semantics explicit in procedure execution", () => {
  const css = read("components/procedure-browser.module.css");

  assert.match(css, /var\(--ft-source-warning\)/);
  assert.match(css, /var\(--ft-source-caution\)/);
  assert.match(css, /var\(--ft-source-note\)/);
});

test("UX3 keeps scenario lifecycle state separate from source safety semantics", () => {
  const css = read("components/scenario-trainer.module.css");

  assert.match(css, /var\(--ft-state-completed\)/);
  assert.match(css, /var\(--ft-training-accent-bg\)/);
  assert.doesNotMatch(
    css,
    /stageDone[\s\S]*var\(--ft-source-(?:warning|caution|note)\)/,
  );
});

test("UX3 harmonizes Systems heading and panel shape with the shared workspace", () => {
  const css = read("components/ft-systems/ft-systems.module.css");

  assert.match(css, /\.pageHeader h1\s*\{[\s\S]*font-size:\s*1\.875rem/);
  assert.match(css, /\.indexPanel\s*\{[\s\S]*border-radius:\s*calc\(var\(--ft-radius-4\) \* 2\)/);
  assert.match(css, /\.mentalModel\s*\{[\s\S]*border-radius:\s*calc\(var\(--ft-radius-4\) \* 2\)/);
});

test("UX3/UX6 keeps fast-path chrome on shared workspace radius tokens", () => {
  const css = read("components/ft-fast-path/ft-fast-path.module.css");

  assert.match(css, /\.tabList\s*\{[\s\S]*border-radius:\s*var\(--ft-radius-panel\)/);
  assert.match(css, /\.currentStep\s*\{[\s\S]*border-radius:\s*calc\(var\(--ft-radius-4\) \* 2\)/);
});

test("UX3 preserves procedure and scenario interaction components instead of forking runtime", () => {
  const operate = read("components/ft-procedures/FtProcedureOperate.tsx");
  const trainer = read("components/scenario-trainer.tsx");

  assert.match(operate, /<ProcedureLinearRunner/);
  assert.match(operate, /<ProcedureGraphRunner/);
  assert.match(trainer, /scenarioSessionReducer/);
  assert.match(trainer, /appendBrowserProgress/);
});
