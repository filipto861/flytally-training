import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("UX6.5 integrates search and phase controls into the procedure navigator", () => {
  const index = read("components/ft-procedures/FtProcedureIndex.tsx");

  assert.match(index, /indexColumn/);
  assert.match(index, /desktopIndex/);
  assert.match(index, /Available procedures/);
  assert.match(index, /Search procedures/);
  assert.match(index, /Procedure phase/);
});

test("UX6.5 makes procedure execution the primary detail task", () => {
  const detail = read("components/ft-procedures/FtProcedureDetail.tsx");
  const operatePosition = detail.indexOf("<FtProcedureOperate");
  const learnPosition = detail.indexOf("<FtProcedureLearn");

  assert.ok(operatePosition >= 0);
  assert.ok(learnPosition > operatePosition);
  assert.match(detail, /contextPanel/);
  assert.match(detail, /<FtProcedureRelevance/);
});

test("UX6.5 mobile keeps one compact procedure selector before task content", () => {
  const index = read("components/ft-procedures/FtProcedureIndex.tsx");
  const css = read("components/ft-procedures/ft-procedures.module.css");

  assert.match(index, /mobileControls/);
  assert.match(index, /<details className=\{styles\.mobileFilters\}>/);
  assert.match(index, /aria-label="Procedure"/);
  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /\.desktopIndex\s*\{[\s\S]*display:\s*none/);
});

test("UX6.5 uses the approved accent and panel tokens without hardcoded palette values", () => {
  const css = read("components/ft-procedures/ft-procedures.module.css");

  for (const token of [
    "--ft-accent-primary",
    "--ft-accent-soft",
    "--ft-bg-panel",
    "--ft-bg-inset",
    "--ft-radius-panel",
    "--ft-focus-color",
  ]) {
    assert.match(css, new RegExp(token));
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
});

test("UX6.5 preserves source authority and P4 execution delegates", () => {
  const detail = read("components/ft-procedures/FtProcedureDetail.tsx");
  const operate = read("components/ft-procedures/FtProcedureOperate.tsx");

  assert.match(detail, /sourcePolicy\s*===\s*"available-sources"/);
  assert.match(detail, /Sources: available training material\. Not FAA-approved\./);
  assert.match(operate, /ProcedureLinearRunner/);
  assert.match(operate, /ProcedureGraphRunner/);
});
