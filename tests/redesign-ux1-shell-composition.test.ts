import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX1/UX6 establishes an intentional desktop content frame", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /\.content\s*\{[\s\S]*justify-items:\s*center/);
  assert.match(
    css,
    /\.content\s*>\s*:global\(\*\)[\s\S]*width:\s*min\(100%,\s*var\(--ft-shell-content-max\)\)/,
  );
});

test("UX6 supersedes the UX1 text sidebar with the approved compact rail without changing IA", () => {
  const css = read("components/ft-shell/ft-shell.module.css");
  const ia = read("lib/aircraft-content-ia.ts");

  assert.match(
    css,
    /grid-template-columns:\s*var\(--ft-shell-rail-width\) minmax\(0, 1fr\)/,
  );
  assert.match(css, /\.sideNavIcon/);
  assert.match(css, /\.sideNavLink\[aria-current="page"\]/);

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

test("UX6 keeps desktop fast path compact while aligning it to the application workspace", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(
    css,
    /\.fastPathRail\s*\{[\s\S]*position:\s*fixed[\s\S]*left:\s*calc\(50% \+ var\(--ft-shell-rail-half\)\)/,
  );
  assert.match(css, /min-width:\s*calc\(var\(--ft-space-7\) \* 8\)/);
  assert.match(css, /border-radius:\s*var\(--ft-radius-panel\)/);
  assert.match(css, /box-shadow:/);
});

test("UX1 keeps the four W3 operational actions unchanged", () => {
  const nav = read("components/ft-shell/navigation.ts");

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    assert.match(nav, new RegExp(`label: "${label}"`));
  }
});

test("UX6 keeps touch layouts edge-attached and accessible", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /@media \(max-width: 1180px\), \(hover: none\)/);
  assert.match(
    css,
    /\.fastPathRail\s*\{[\s\S]*bottom:\s*0[\s\S]*width:\s*100%[\s\S]*safe-area-inset-bottom/,
  );
  assert.match(
    css,
    /\.fastPathLink\s*\{[\s\S]*min-height:\s*var\(--ft-fast-path-height-ipad\)/,
  );
});
