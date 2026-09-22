import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX1 establishes an intentional desktop content frame", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /\.content\s*\{[\s\S]*justify-items:\s*center/);
  assert.match(
    css,
    /\.content\s*>\s*:global\(\*\)[\s\S]*width:\s*min\(100%,\s*calc\(var\(--ft-space-7\) \* 26\)\)/,
  );
});

test("UX1 reduces permanent desktop navigation width without changing IA", () => {
  const css = read("components/ft-shell/ft-shell.module.css");
  const ia = read("lib/aircraft-content-ia.ts");

  assert.match(
    css,
    /grid-template-columns:\s*calc\(var\(--ft-space-7\) \* 4\) minmax\(0, 1fr\)/,
  );
  for (const label of [
    "AIRCRAFT",
    "PROCEDURES",
    "PERFORMANCE",
    "TRAINING",
    "FLIGHT",
  ]) {
    assert.match(ia, new RegExp(`label: "${label}"`));
  }
});

test("UX1 changes desktop fast path from viewport strip to compact dock", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(
    css,
    /\.fastPathRail\s*\{[\s\S]*justify-self:\s*center[\s\S]*width:\s*min\(calc\(var\(--ft-space-7\) \* 12\)/,
  );
  assert.match(css, /border-radius:\s*calc\(var\(--ft-radius-4\) \* 3\)/);
  assert.match(css, /box-shadow:/);
});

test("UX1 keeps the four W3 operational actions unchanged", () => {
  const nav = read("components/ft-shell/navigation.ts");

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    assert.match(nav, new RegExp(`label: "${label}"`));
  }
});

test("UX1 keeps touch layouts full-width enough for four accessible targets", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(
    css,
    /\.fastPathRail\s*\{[\s\S]*bottom:\s*0[\s\S]*width:\s*100%[\s\S]*--ft-fast-path-height-ipad[\s\S]*safe-area-inset-bottom/,
  );
  assert.match(
    css,
    /\.fastPathLink\s*\{[\s\S]*min-height:\s*var\(--ft-fast-path-height-ipad\)/,
  );
});
