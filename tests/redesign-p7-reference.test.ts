import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { toReferencePresentation } from "../lib/reference-presentation.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P7.1 keeps REF as the fourth frozen W3 slot", () => {
  const panel = read("lib/fast-path/panel-state.ts");
  assert.match(panel, /"checklist",\s*"qrh",\s*"perf",\s*"ref"/);
});

test("P7.1 records universal limitations as the new-shell REF source of truth", () => {
  const inventory = read("P7_REFERENCE_FAST_PATH.md");

  assert.match(inventory, /governed universal[\s\S]*limitations/i);
  assert.match(inventory, /PERF already owns operational performance lookup/i);
  assert.match(inventory, /reference-knowledge[\s\S]*not.*promoted/i);
});

test("P7.2 projection preserves governed limitation facts and provenance", () => {
  const reference = toReferencePresentation({
    aircraftId: "generic-aircraft",
    title: "Generic Limits",
    sourceNote: "Source note.",
    disclaimer: "Training only.",
    groups: [
      {
        id: "speeds",
        title: "Speeds",
        sources: [{ manualId: "group-source", pageLabel: "10" }],
        items: [
          {
            id: "vmo",
            label: "Maximum operating speed",
            value: 200,
            unit: "KIAS",
            condition: "Generic condition",
            notices: [{ kind: "caution", text: "Generic caution." }],
            sources: [{ manualId: "item-source", pageLabel: "11" }],
          },
        ],
      },
    ],
  });

  assert.ok(reference);
  assert.equal(reference.title, "Generic Limits");
  assert.equal(reference.itemCount, 1);
  assert.equal(reference.groups[0]?.items[0]?.value, 200);
  assert.equal(reference.groups[0]?.items[0]?.unit, "KIAS");
  assert.equal(reference.groups[0]?.items[0]?.condition, "Generic condition");
  assert.deepEqual(reference.groups[0]?.items[0]?.notices, [
    { kind: "caution", text: "Generic caution." },
  ]);
  assert.deepEqual(reference.groups[0]?.items[0]?.sources, [
    { manualId: "item-source", pageLabel: "11" },
  ]);
});

test("P7.2 projection fails closed without published limitation items", () => {
  assert.equal(toReferencePresentation(undefined), undefined);
  assert.equal(
    toReferencePresentation({
      aircraftId: "generic-aircraft",
      title: "Empty",
      groups: [],
    }),
    undefined,
  );
});

test("P7 reference implementation is presentation-only and aircraft-agnostic", () => {
  const source = [
    read("lib/reference-presentation.ts"),
    read("components/ft-reference/FtReferencePresentation.tsx"),
  ].join("\n");

  assert.doesNotMatch(source, /learjet|35a|tfe731|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(source, /aircraft\.model\s*===/i);
  assert.doesNotMatch(source, /performance-calculator|calculatePerformance/i);
  assert.doesNotMatch(source, /reference-knowledge/i);
});
