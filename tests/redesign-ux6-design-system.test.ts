import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX6 specimen demonstrates the production visual direction without altering shell ownership", () => {
  const page = read("app/ux6-preview/page.tsx");
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(page, /data-ux6-preview="true"/);
  assert.match(page, /Learjet 35A/);
  assert.match(page, /Before Start/);
  assert.match(css, /grid-template-columns:\s*72px/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(shell, /ux6-preview/i);
});

test("UX6 accessibility primitives remain in the specimen", () => {
  const css = read("app/ux6-preview/ux6-preview.module.css");
  const page = read("app/ux6-preview/page.tsx");

  assert.match(css, /44px/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(page, /aria-current/);
  assert.match(page, /aria-label/);
});
