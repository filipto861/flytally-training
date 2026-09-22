import assert from "node:assert/strict";
import test from "node:test";

import { validateContentPayload } from "../lib/content-contracts.ts";

const source = {
  manualId: "manual-p3",
  chapter: "27",
  section: "Test system",
  pageLabel: "27-1",
};

function validPayload() {
  return {
    aircraftId: "test-aircraft",
    title: "Aircraft systems",
    systems: [
      {
        id: "test-system",
        title: "Test System",
        summary: "Generic source-backed system used for P3 contract tests.",
        schematic: {
          version: 1,
          title: "Logical schematic",
          description: "Not to scale.",
          sources: [source],
          nodes: [
            {
              id: "source-a",
              label: "Source A",
              role: "source",
              x: 10,
              y: 50,
            },
            {
              id: "consumer-a",
              label: "Consumer A",
              role: "consumer",
              x: 90,
              y: 50,
              sources: [source],
            },
          ],
          edges: [
            {
              id: "source-to-consumer",
              from: "source-a",
              to: "consumer-a",
              direction: "forward",
              label: "Supply",
            },
          ],
        },
      },
    ],
  };
}

function errorsFor(payload: unknown): readonly string[] {
  return validateContentPayload("systems", payload, "test-aircraft");
}

test("P3 valid v1 systems schematic passes universal validation", () => {
  assert.deepEqual(errorsFor(validPayload()), []);
});

test("P3 duplicate schematic node IDs are rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.nodes[1].id = "source-a";

  assert.match(errorsFor(payload).join("\n"), /nodes\[1\]\.id duplicated: source-a/);
});

test("P3 duplicate edge IDs are rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.edges.push({
    id: "source-to-consumer",
    from: "source-a",
    to: "consumer-a",
    direction: "forward",
    label: "Backup supply",
  });

  assert.match(errorsFor(payload).join("\n"), /edges\[1\]\.id duplicated: source-to-consumer/);
});

test("P3 invalid non-finite and out-of-range schematic coordinates are rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.nodes[0].x = Number.NaN;
  payload.systems[0].schematic.nodes[0].y = -1;
  payload.systems[0].schematic.nodes[1].x = 101;

  const errors = errorsFor(payload).join("\n");
  assert.match(errors, /nodes\[0\]\.x must be finite within 0\.\.100/);
  assert.match(errors, /nodes\[0\]\.y must be finite within 0\.\.100/);
  assert.match(errors, /nodes\[1\]\.x must be finite within 0\.\.100/);
});

test("P3 dangling schematic edge endpoint is rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.edges[0].to = "missing-node";

  assert.match(
    errorsFor(payload).join("\n"),
    /edges\[0\]\.to references unknown node: missing-node/,
  );
});

test("P3 self-loop schematic edge is rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.edges[0].to = "source-a";

  assert.match(errorsFor(payload).join("\n"), /edges\[0\] self-loop not allowed/);
});

test("P3 empty schematic sources are rejected", () => {
  const payload = validPayload();
  payload.systems[0].schematic.sources = [];

  assert.match(
    errorsFor(payload).join("\n"),
    /schematic\.sources is required and must be non-empty/,
  );
});

test("P3 explicit empty node and edge sources are rejected while absent sources inherit schematic provenance", () => {
  const inherited = validPayload();
  delete inherited.systems[0].schematic.nodes[1].sources;
  assert.deepEqual(errorsFor(inherited), []);

  const emptyNodeSources = validPayload();
  emptyNodeSources.systems[0].schematic.nodes[0].sources = [];
  assert.match(
    errorsFor(emptyNodeSources).join("\n"),
    /nodes\[0\]\.sources present but empty or malformed/,
  );

  const emptyEdgeSources = validPayload();
  emptyEdgeSources.systems[0].schematic.edges[0].sources = [];
  assert.match(
    errorsFor(emptyEdgeSources).join("\n"),
    /edges\[0\]\.sources present but empty or malformed/,
  );
});

test("P3 system without schematic remains valid for sparse text-only aircraft content", () => {
  const payload = validPayload();
  delete payload.systems[0].schematic;

  assert.deepEqual(errorsFor(payload), []);
});
