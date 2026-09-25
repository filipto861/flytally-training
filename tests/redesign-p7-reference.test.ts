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
  const inventory = read("TECHNICAL_DOCUMENTATION.md");

  assert.match(inventory, /governed universal limitations\/reference data/i);
  assert.match(inventory, /PERF already owns operational performance lookup/i);
  assert.match(inventory, /must not.*promote legacy.*reference-knowledge.*content/i);
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


test("P7.3 shell loads governed limitations for REF without changing PERF", () => {
  const shell = read("components/ft-shell/FtShell.tsx");
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");

  assert.match(
    shell,
    /getPublishedAircraftModule<AircraftLimitationsContent>[\s\S]*"limitations"/,
  );
  assert.match(shell, /referenceContent=\{publishedLimitations\}/);
  assert.match(panel, /<FtFastPathReference/);
  assert.match(panel, /content=\{referenceContent\}/);
  assert.match(panel, /<FtPerformancePresentation/);
  assert.doesNotMatch(panel, /FtFastPathPlaceholder/);
});

test("P7.3 fast-path REF resolves variant query through the existing applicability resolver", () => {
  const fast = read("components/ft-fast-path/FtFastPathReference.tsx");

  assert.match(fast, /window\.location\.search/);
  assert.match(fast, /resolveSelectedVariant/);
  assert.match(fast, /configurationForAircraftVariant/);
  assert.match(fast, /filterLimitationsForConfiguration/);
  assert.match(fast, /withVariantQuery/);
  assert.doesNotMatch(fast, /aircraft\.model\s*===/i);
});

test("P7.3 new-shell Reference route shares the same presentation projection and preserves legacy fallback", () => {
  const route = read("app/aircraft/[aircraftId]/reference/page.tsx");

  assert.match(route, /isNewShellEnabled/);
  assert.match(route, /filterLimitationsForConfiguration/);
  assert.match(route, /toReferencePresentation/);
  assert.match(route, /<FtReferencePage/);
  assert.match(route, /<AircraftWorkspaceNav/);
  assert.doesNotMatch(route, /FtShell/);
});

test("P7.3 REF no longer uses the W3 placeholder", () => {
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");

  assert.match(panel, /FtFastPathReference/);
  assert.doesNotMatch(panel, /FtFastPathPlaceholder/);
});

test("P7.4 deterministic browser fixture publishes governed limitations", () => {
  const fixture = read("lib/browser-training-fixture.ts");

  assert.match(fixture, /browser-ci-limitations-source/);
  assert.match(fixture, /Maximum generic speed/);
  assert.match(fixture, /value:200/);
  assert.match(fixture, /unit:"KIAS"/);
  assert.match(fixture, /domain:"limitations",payload:limitations/);
  assert.doesNotMatch(
    fixture.slice(
      fixture.indexOf("const limitationsSource"),
      fixture.indexOf("const systemsSource"),
    ),
    /learjet|35a|tfe731|bristell|cessna|boeing|rotax/i,
  );
});
