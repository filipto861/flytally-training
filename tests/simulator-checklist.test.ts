import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536ColdDarkFlow } from "../lib/simulator-checklists.ts";

test("Learjet simulator flow always starts and ends cold and dark", () => {
  assert.equal(learjet3536ColdDarkFlow.phases[0]?.id, "cold-dark");
  assert.equal(learjet3536ColdDarkFlow.phases.at(-1)?.id, "shutdown");
});

test("every simulator checklist item has unique identity and a manual source", () => {
  const items = learjet3536ColdDarkFlow.phases.flatMap((phase) => phase.items);
  const ids = new Set(items.map((item) => item.id));

  assert.equal(ids.size, items.length);
  assert.ok(items.length > 20);
  for (const item of items) {
    assert.ok(item.source.chapter > 0);
    assert.ok(item.source.manualPage.length > 0);
    assert.ok(item.action.length > 0);
  }
});

test("the default path is explicitly simulator-oriented", () => {
  assert.match(learjet3536ColdDarkFlow.sourceNote, /Simulator-oriented/i);
  assert.match(learjet3536ColdDarkFlow.sourceNote, /not an approved aircraft checklist/i);
});
