import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX6.2 defines explicit peer light and dark surface systems", () => {
  const doc = read("TECHNICAL_DOCUMENTATION.md");

  for (const token of [
    "--ux6-canvas",
    "--ux6-workspace",
    "--ux6-panel",
    "--ux6-elevated",
    "--ux6-selected",
    "--ux6-accent",
  ]) {
    assert.match(doc, new RegExp(token));
  }

  assert.match(doc, /### Light/);
  assert.match(doc, /### Dark/);
});

test("UX6.2 keeps source safety semantics separate from application state", () => {
  const doc = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(doc, /Application state is separate from source-safety semantics/i);
  assert.match(doc, /WARNING \/ CAUTION \/ NOTE/i);
  assert.match(doc, /Source age remains neutral metadata/i);
});

test("UX6.2 specimen demonstrates the approved shell direction without altering production shell", () => {
  const page = read("app/ux6-preview/page.tsx");
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(page, /data-ux6-preview="true"/);
  assert.match(page, /Learjet 35A/);
  assert.match(page, /Before Start/);
  assert.match(page, /CHECKLIST/);
  assert.match(page, /QRH/);
  assert.match(css, /grid-template-columns:\s*72px/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(shell, /ux6-preview/i);
});

test("UX6.2 preserves accessibility primitives in the specimen", () => {
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const page = read("app/ux6-preview/page.tsx");

  assert.match(css, /44px/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(page, /aria-current/);
  assert.match(page, /aria-label/);
});
