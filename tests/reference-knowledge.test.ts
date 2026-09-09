import assert from "node:assert/strict";
import test from "node:test";

import { learjet3536ReferenceKnowledge } from "../lib/reference-knowledge.ts";

test("Learjet Quick Reference covers the M6 high-value groups", () => {
  const ids = learjet3536ReferenceKnowledge.groups.map((group) => group.id);
  for (const required of ["takeoff-landing", "fuel", "pressurization", "power-hydraulics", "engine-start", "flight-controls"]) {
    assert.ok(ids.includes(required), `missing reference group ${required}`);
  }
});

test("every Quick Reference item retains source provenance", () => {
  for (const group of learjet3536ReferenceKnowledge.groups) {
    assert.ok(group.items.length > 0);
    for (const item of group.items) {
      assert.ok(item.source.length > 0, `${item.id} must have a source`);
      assert.ok(item.source.every((source) => source.chapter > 0 && source.manualPage.length > 0));
    }
  }
});

test("knowledge bank is source-linked and answer indexes are valid", () => {
  assert.ok(learjet3536ReferenceKnowledge.questions.length >= 10);
  for (const question of learjet3536ReferenceKnowledge.questions) {
    assert.ok(question.source.length > 0, `${question.id} must have a source`);
    assert.ok(question.choices.length >= 3);
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.choices.length);
    assert.ok(question.explanation.length > 0);
  }
});

test("performance-derived V-speeds are not flattened into a generic fixed value", () => {
  const takeoff = learjet3536ReferenceKnowledge.groups.find((group) => group.id === "takeoff-landing");
  assert.ok(takeoff);
  const vSpeeds = takeoff.items.find((item) => item.id === "v-speeds");
  assert.ok(vSpeeds);
  assert.match(vSpeeds.value, /performance data/i);
  assert.doesNotMatch(vSpeeds.value, /^\d+\s*kt$/i);
});
