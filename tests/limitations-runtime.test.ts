import assert from "node:assert/strict";
import test from "node:test";

import { countLimitationItems, filterLimitationGroups, limitationSearchText } from "../lib/limitations-runtime.ts";
import type { LimitationGroup } from "../lib/universal-aircraft-content.ts";

const groups: readonly LimitationGroup[] = [
  {
    id: "speeds",
    title: "Airspeed",
    items: [
      { id: "vne", label: "Never exceed speed", value: 160, unit: "KIAS", notices: [{ kind: "warning", text: "Do not exceed this speed." }] },
      { id: "vfe", label: "Maximum flap extended speed", value: 90, unit: "KIAS", condition: "Flaps extended" },
    ],
  },
  {
    id: "weights",
    title: "Weights",
    items: [
      { id: "mtow", label: "Maximum takeoff weight", value: 600, unit: "kg", notices: [{ kind: "caution", text: "Observe the applicable loading envelope." }] },
    ],
  },
];

test("limitation search text includes group, value, unit, condition and notices", () => {
  const text = limitationSearchText(groups[0].items[1], groups[0].title);
  assert.match(text, /airspeed/);
  assert.match(text, /90/);
  assert.match(text, /kias/);
  assert.match(text, /flaps extended/);
});

test("limitation filtering preserves source grouping while narrowing results", () => {
  const filtered = filterLimitationGroups(groups, { query: "takeoff" });
  assert.deepEqual(filtered.map((group) => group.id), ["weights"]);
  assert.deepEqual(filtered[0]?.items.map((item) => item.id), ["mtow"]);
});

test("warning and caution filters use only explicit source notices", () => {
  assert.deepEqual(filterLimitationGroups(groups, { notice: "warning" }).flatMap((group) => group.items.map((item) => item.id)), ["vne"]);
  assert.deepEqual(filterLimitationGroups(groups, { notice: "caution" }).flatMap((group) => group.items.map((item) => item.id)), ["mtow"]);
});

test("limitation count is derived from current aircraft content", () => {
  assert.equal(countLimitationItems(groups), 3);
  assert.equal(countLimitationItems(filterLimitationGroups(groups, { groupId: "speeds" })), 2);
});
