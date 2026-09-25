import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const docs = read("TECHNICAL_DOCUMENTATION.md");

test("current UX documentation freezes explicit LEARN and EFB product modes", () => {
  assert.match(docs, /LEARN.*aircraft knowledge, systems, procedures/i);
  assert.match(docs, /EFB.*operational flight tools/i);
});

test("current UX documentation preserves the four fast-path destinations", () => {
  assert.match(docs, /CHECKLIST → QRH → PERF → REF/);
  assert.match(docs, /Ctrl\+Shift\+1 through Ctrl\+Shift\+4/i);
});

test("current UX documentation requires desktop, mobile and iPad acceptance", () => {
  assert.match(docs, /cockpit\/tablet use first/i);
  assert.match(docs, /desktop and mobile/i);
  assert.match(docs, /desktop, mobile and iPad/i);
});

test("current UX documentation keeps source safety separate from interaction emphasis", () => {
  assert.match(docs, /source\/safety semantic states remain visually distinct from interaction accent/i);
  assert.match(docs, /missing governed content is shown as unavailable\/fail-closed/i);
});

test("documentation sprawl is replaced by one maintained technical reference", () => {
  assert.match(docs, /single maintained technical\/product documentation reference/i);
  assert.match(docs, /Historical milestone documents were consolidated here/i);
});
