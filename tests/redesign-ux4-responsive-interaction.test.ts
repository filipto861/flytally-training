import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("UX4 new shell clips accidental horizontal overflow and respects device safe areas", () => {
  const css = read("components/ft-shell/ft-shell.module.css");

  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /height:\s*100dvh/);
});

test("UX4 modal search and fast path use dynamic viewport height and contained scrolling", () => {
  const search = read("components/ft-search/ft-search.module.css");
  const fastPath = read("components/ft-fast-path/ft-fast-path.module.css");

  assert.match(search, /height:\s*100dvh/);
  assert.match(search, /overscroll-behavior:\s*contain/);
  assert.match(search, /safe-area-inset-top/);
  assert.match(search, /safe-area-inset-bottom/);

  assert.match(fastPath, /height:\s*100dvh/);
  assert.match(fastPath, /overscroll-behavior:\s*contain/);
  assert.match(fastPath, /safe-area-inset-top/);
  assert.match(fastPath, /safe-area-inset-bottom/);
});

test("UX4 preserves explicit reduced-motion handling in new-shell overlays", () => {
  const shell = read("components/ft-shell/ft-shell.module.css");
  const search = read("components/ft-search/ft-search.module.css");
  const fastPath = read("components/ft-fast-path/ft-fast-path.module.css");

  assert.match(shell, /prefers-reduced-motion:\s*reduce/);
  assert.match(search, /prefers-reduced-motion:\s*reduce/);
  assert.match(fastPath, /prefers-reduced-motion:\s*reduce/);
  assert.match(fastPath, /animation:\s*none/);
});

test("UX4 preserves active and completed state in forced-colors mode", () => {
  for (const path of [
    "components/ft-shell/ft-shell.module.css",
    "components/ft-search/ft-search.module.css",
    "components/ft-fast-path/ft-fast-path.module.css",
    "components/procedure-browser.module.css",
    "components/scenario-trainer.module.css",
  ]) {
    const css = read(path);
    assert.match(css, /forced-colors:\s*active/, path);
    assert.match(css, /Highlight/, path);
  }
});

test("UX4 keeps search and fast-path dialogs modal with keyboard focus containment", () => {
  const search = read("components/ft-search/FtSearchOverlay.tsx");
  const fastPath = read("components/ft-fast-path/FtFastPathPanel.tsx");

  for (const source of [search, fastPath]) {
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /event\.key !== "Tab"|event\.key === "Escape"/);
  }

  assert.match(search, /triggerRef\.current\?\.focus/);
  assert.match(fastPath, /returnFocusRef\.current\?\.focus/);
});

test("UX4 keeps touch-first controls anchored to the frozen workspace touch target", () => {
  const sources = [
    read("components/ft-shell/ft-shell.module.css"),
    read("components/ft-search/ft-search.module.css"),
    read("components/ft-fast-path/ft-fast-path.module.css"),
    read("components/procedure-browser.module.css"),
  ].join("\n");

  assert.match(sources, /var\(--ft-touch-target-min\)/);
  assert.doesNotMatch(
    read("components/ft-shell/ft-shell.module.css").replaceAll("1180px", ""),
    /\b\d+(?:\.\d+)?px\b/,
  );
});
