import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  assertApplicabilityVariantsRegistered,
  collectEmbeddedVariantKeys,
} from "../lib/content-applicability-binding.ts";

test("M43 collects variant applicability across nested and top-level content", () => {
  const payload = {
    applicability: { variants: ["sn-001"] },
    groups: [
      { items: [{ applicability: { variants: ["sn-002", "sn-001"] } }] },
    ],
    variants: ["not-an-applicability-reference"],
  };

  assert.deepEqual([...collectEmbeddedVariantKeys(payload)].sort(), ["sn-001", "sn-002"]);
});

test("M43 accepts only registered applicability variants", () => {
  const payload = {
    datasets: [
      { applicability: { variants: ["common", "sn-809"] } },
    ],
  };

  assert.doesNotThrow(() => assertApplicabilityVariantsRegistered(payload, ["common", "sn-809"], "test-aircraft"));
  assert.throws(
    () => assertApplicabilityVariantsRegistered(payload, ["common"], "test-aircraft"),
    /unregistered variant\(s\).*test-aircraft.*sn-809/i,
  );
});

test("M43 leaves non-variant-scoped payloads compatible with sparse aircraft", () => {
  assert.doesNotThrow(() => assertApplicabilityVariantsRegistered({ title: "Generic" }, [], "generic-aircraft"));
});

test("M43 approval/publication governance invokes the applicability integrity gate", () => {
  const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
  assert.match(governance, /assertEmbeddedApplicabilityMatchesAircraft/);
  assert.match(governance, /await assertEmbeddedApplicabilityMatchesAircraft\(version\.aircraftId, version\.payload\)/);
});
