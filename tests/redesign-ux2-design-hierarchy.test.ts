import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const hierarchyCss = [
  "components/ft-launch/ft-launch.module.css",
  "components/ft-flight/ft-flight.module.css",
  "components/ft-performance/ft-performance.module.css",
  "components/ft-procedures/ft-procedures.module.css",
  "components/ft-training/ft-training.module.css",
  "components/ft-reference/ft-reference.module.css",
] as const;

test("UX2 presentation modules use workspace semantic colors instead of hardcoded palette values", () => {
  for (const path of hierarchyCss) {
    const css = read(path);
    assert.doesNotMatch(
      css,
      /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i,
      `${path} must use workspace semantic colors`,
    );
  }
});

test("UX2 gives primary pages a consistent high-level heading scale", () => {
  for (const path of [
    "components/ft-launch/ft-launch.module.css",
    "components/ft-flight/ft-flight.module.css",
    "components/ft-performance/ft-performance.module.css",
    "components/ft-training/ft-training.module.css",
    "components/ft-reference/ft-reference.module.css",
  ]) {
    const css = read(path);
    assert.match(css, /font-size:\s*1\.875rem/);
    assert.match(css, /font-weight:\s*700/);
  }
});

test("UX2 promotes primary actions without using source or safety semantics", () => {
  const sources = [
    read("components/ft-launch/ft-launch.module.css"),
    read("components/ft-flight/ft-flight.module.css"),
    read("components/ft-performance/ft-performance.module.css"),
  ].join("\n");

  assert.match(sources, /background:\s*var\(--ft-bg-operational\)/);
  assert.match(sources, /border:\s*var\(--ft-rule-strong\)/);
  assert.match(sources, /font-weight:\s*700/);
  assert.doesNotMatch(
    sources,
    /background:\s*var\(--ft-source-(?:warning|caution|note)\)/,
  );
});

test("UX2 uses panel grouping and a common radius across core workspaces", () => {
  for (const path of hierarchyCss) {
    const css = read(path);
    assert.match(css, /var\(--ft-bg-panel\)/);
    assert.match(css, /var\(--ft-rule-default\)/);
    assert.match(css, /var\(--ft-radius-panel\)/);
  }
});

test("UX2 keeps empty and secondary surfaces neutral instead of authoritative", () => {
  const sources = [
    read("components/ft-launch/ft-launch.module.css"),
    read("components/ft-flight/ft-flight.module.css"),
    read("components/ft-performance/ft-performance.module.css"),
    read("components/ft-procedures/ft-procedures.module.css"),
    read("components/ft-reference/ft-reference.module.css"),
  ].join("\n");

  assert.match(sources, /var\(--ft-bg-inset\)/);
  assert.match(sources, /var\(--ft-text-metadata\)/);
});

test("UX2 removes legacy fallback palette definitions from Training and Reference", () => {
  for (const path of [
    "components/ft-training/ft-training.module.css",
    "components/ft-reference/ft-reference.module.css",
  ]) {
    const css = read(path);
    assert.doesNotMatch(css, /var\(--[a-z0-9-]+\s*,/i);
  }
});
