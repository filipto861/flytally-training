import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("UX1 historical frame is superseded by the UX6 fluid workspace", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /\.content\s*\{[\s\S]*justify-items:\s*stretch/);
  assert.match(
    css,
    /\.content\s*>\s*:global\(\*\)[\s\S]*width:\s*min\(100%,\s*var\(--ft-shell-content-max\)\)/,
  );
  assert.doesNotMatch(css, /calc\(var\(--ft-space-7\) \* 26\)/);
});

test("UX6 replaces the text sidebar with a compact rail without changing IA", () => {
  const css = read("components/ft-shell/ft-shell.module.css");
  const ia = read("lib/aircraft-content-ia.ts");
  const sideNav = read("components/ft-shell/FtSideNav.tsx");

  assert.match(
    css,
    /grid-template-columns:\s*var\(--ft-shell-rail-width\) minmax\(0, 1fr\)/,
  );
  assert.match(sideNav, /DestinationIcon/);
  assert.match(sideNav, /brandMark/);

  for (const label of [
    "AIRCRAFT",
    "PROCEDURES",
    "PERFORMANCE",
    "TRAINING",
    "FLIGHT",
  ]) {
    assert.match(ia, new RegExp('label: "' + label + '"'));
  }
});

test("UX6 desktop fast path is a compact four-action application dock", () => {
  const css = read("components/ft-shell/ft-shell.module.css");
  const rail = read("components/ft-shell/FtFastPathRail.tsx");

  assert.match(css, /\.fastPathRail\s*\{[\s\S]*position:\s*fixed/);
  assert.match(css, /width:\s*min\(calc\(var\(--ft-space-7\) \* 8\)/);
  assert.match(css, /border-radius:\s*var\(--ft-radius-panel\)/);
  assert.match(rail, /fastPathGlyph/);
});

test("UX6 keeps the four W3 operational actions unchanged", () => {
  const nav = read("components/ft-shell/navigation.ts");

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    assert.match(nav, new RegExp('label: "' + label + '"'));
  }
});

test("UX6 keeps touch layouts full-width and safe-area aware", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(
    css,
    /\.fastPathRail\s*\{[\s\S]*inset-inline:\s*0[\s\S]*width:\s*100%[\s\S]*--ft-fast-path-height-ipad[\s\S]*safe-area-inset-bottom/,
  );
  assert.match(
    css,
    /\.fastPathLink\s*\{[\s\S]*min-height:\s*var\(--ft-fast-path-height-ipad\)/,
  );
});
