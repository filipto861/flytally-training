import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { checklistSessionStorageKey } from "../lib/checklist-session.ts";
import type { RuntimeChecklist } from "../lib/checklist-runtime.ts";
import {
  fastPathChecklistProgress,
  restoreFastPathChecklistSession,
  saveFastPathChecklistSession,
  toggleFastPathChecklistItem,
  type ChecklistSessionStorage,
} from "../lib/fast-path/checklist-adapter.ts";
import {
  fastPathTabForShortcut,
  initialFastPathPanelState,
  reduceFastPathPanelState,
} from "../lib/fast-path/panel-state.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const checklist: RuntimeChecklist = {
  aircraftId: "test-aircraft",
  title: "Normal Checklist",
  phases: [
    {
      id: "before-start",
      title: "Before Start",
      items: [
        { id: "battery", challenge: "Battery", response: "ON" },
        { id: "brakes", challenge: "Parking brake", response: "SET" },
      ],
    },
  ],
};

class MemoryStorage implements ChecklistSessionStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("W3 panel state opens, closes and switches tabs without persistence", () => {
  const opened = reduceFastPathPanelState(initialFastPathPanelState, { type: "open", tab: "qrh" });
  assert.deepEqual(opened, { open: true, activeTab: "qrh" });
  const switched = reduceFastPathPanelState(opened, { type: "select", tab: "perf" });
  assert.deepEqual(switched, { open: true, activeTab: "perf" });
  const closed = reduceFastPathPanelState(switched, { type: "close" });
  assert.deepEqual(closed, { open: false, activeTab: "perf" });
});

test("W3 checklist adapter delegates storage identity and normalization to checklist-session", () => {
  const storage = new MemoryStorage();
  const variant = "Standard";
  const initial = restoreFastPathChecklistSession(checklist, storage, variant);
  const toggled = toggleFastPathChecklistItem(initial, "battery", checklist);
  saveFastPathChecklistSession(checklist, toggled, storage, variant);

  const expectedKey = checklistSessionStorageKey(checklist, variant);
  assert.ok(storage.values.has(expectedKey));
  const restored = restoreFastPathChecklistSession(checklist, storage, variant);
  assert.deepEqual(restored.completedIds, ["battery"]);
  assert.deepEqual(fastPathChecklistProgress(checklist, restored), {
    completed: 1,
    total: 2,
    active: true,
  });

  const adapter = read("lib/fast-path/checklist-adapter.ts");
  assert.match(adapter, /checklistSessionStorageKey/);
  assert.match(adapter, /normalizeChecklistSessionSnapshot/);
  assert.match(adapter, /checklistPhaseProgress/);
});

test("W3 fast path rail opens tools instead of navigating", () => {
  const rail = read("components/ft-shell/FtFastPathRail.tsx");
  assert.match(rail, /useFtFastPath/);
  assert.match(rail, /onClick=\{\(\) => openPanel\(destination\.key\)\}/);
  assert.match(rail, /<button/);
  assert.doesNotMatch(rail, /<Link|href=/);
});

test("W3 panel styling uses frozen tokens and the token-derived 520px desktop drawer", () => {
  const css = read("components/ft-fast-path/ft-fast-path.module.css");
  for (const token of [
    "--ft-bg-panel",
    "--ft-bg-inset",
    "--ft-bg-operational",
    "--ft-text-primary",
    "--ft-text-secondary",
    "--ft-text-metadata",
    "--ft-space-4",
    "--ft-space-5",
    "--ft-space-7",
    "--ft-touch-target-min",
    "--ft-rule-default",
  ]) {
    assert.match(css, new RegExp(`var\\(${token.replaceAll("-", "\\-")}\\)`));
  }
  assert.match(css, /width: calc\(var\(--ft-space-7\) \* 10 \+ var\(--ft-space-5\) \+ var\(--ft-space-4\)\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(css.replaceAll("1180px", ""), /\b\d+(?:\.\d+)?px\b/);
});

test("W3 Alt+1 through Alt+4 shortcuts map to the four fast path tabs", () => {
  assert.equal(fastPathTabForShortcut({ altKey: true, key: "1" }), "checklist");
  assert.equal(fastPathTabForShortcut({ altKey: true, key: "2" }), "qrh");
  assert.equal(fastPathTabForShortcut({ altKey: true, key: "3" }), "perf");
  assert.equal(fastPathTabForShortcut({ altKey: true, key: "4" }), "ref");
  assert.equal(fastPathTabForShortcut({ altKey: false, key: "1" }), undefined);
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");
  assert.match(provider, /window\.addEventListener\("keydown", handleKeyDown\)/);
});

test("W3 checklist indicator renders only for active progress and reopens CHECKLIST", () => {
  const indicator = read("components/ft-fast-path/FtFastPathIndicator.tsx");
  assert.match(indicator, /if \(!checklistProgress\.active\) return null/);
  assert.match(indicator, /Checklist \{checklistProgress\.completed\}\/\{checklistProgress\.total\}/);
  assert.match(indicator, /onClick=\{\(\) => openPanel\("checklist"\)\}/);
});
