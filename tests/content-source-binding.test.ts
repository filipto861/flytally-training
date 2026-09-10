import assert from "node:assert/strict";
import test from "node:test";

import { collectEmbeddedManualIds, selectContentSourceReferenceIds } from "../lib/content-source-binding.ts";

test("universal module provenance is derived from embedded manual identities", () => {
  const payload = {
    aircraftId: "example",
    phases: [
      { id: "one", sources: [{ manualId: "aircraft-training", pageLabel: "2-1" }] },
      { id: "two", items: [{ id: "step", sources: [{ manualId: "sim-workflow", pageLabel: "4" }] }] },
      { id: "three", sources: [{ manualId: "aircraft-training", pageLabel: "2-2" }] },
    ],
  };

  assert.deepEqual(collectEmbeddedManualIds(payload), ["aircraft-training", "sim-workflow"]);
  assert.deepEqual(
    selectContentSourceReferenceIds(
      payload,
      new Map([["aircraft-training", "ref:training"], ["sim-workflow", "ref:sim"]]),
      ["ref:training", "ref:sim", "ref:unrelated"],
    ),
    ["ref:training", "ref:sim"],
  );
});

test("legacy payloads without embedded manual identity retain the migration fallback", () => {
  const fallback = ["ref:training", "ref:legacy"];
  assert.deepEqual(
    selectContentSourceReferenceIds({ aircraftId: "example", source: [{ chapter: 2, manualPage: "2-1" }] }, new Map(), fallback),
    fallback,
  );
});

test("a native module cannot silently publish against an unknown cited source", () => {
  assert.throws(
    () => selectContentSourceReferenceIds(
      { aircraftId: "example", sources: [{ manualId: "not-registered", pageLabel: "1" }] },
      new Map([["registered", "ref:registered"]]),
      ["ref:registered"],
    ),
    /unregistered source manual not-registered/,
  );
});
