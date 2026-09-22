import assert from "node:assert/strict";
import test from "node:test";

import {
  configurationForVariant,
  filterSystemsForConfiguration,
} from "../lib/aircraft-applicability.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { systemSearchText } from "../lib/systems-runtime.ts";
import type { AircraftSystemsContent } from "../lib/universal-aircraft-content.ts";

type TestSource = {
  manualId: string;
  chapter?: string;
  section?: string;
  pageLabel: string;
};

type TestNode = {
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
  sources?: TestSource[];
};

type TestEdge = {
  id: string;
  from: string;
  to: string;
  direction: string;
  label?: string;
  sources?: TestSource[];
};

type TestSchematic = {
  version: number;
  title?: string;
  description?: string;
  sources: TestSource[];
  nodes: TestNode[];
  edges: TestEdge[];
};

type TestPayload = {
  aircraftId: string;
  title: string;
  systems: Array<{
    id: string;
    title: string;
    summary: string;
    schematic?: TestSchematic;
  }>;
};

const source: TestSource = {
  manualId: "manual-p3",
  chapter: "27",
  section: "Test system",
  pageLabel: "27-1",
};

function validPayload(): TestPayload {
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

function schematicOf(payload: TestPayload): TestSchematic {
  const schematic = payload.systems[0]?.schematic;
  assert.ok(schematic);
  return schematic;
}

function errorsFor(payload: unknown): readonly string[] {
  return validateContentPayload("systems", payload, "test-aircraft");
}

test("P3 valid v1 systems schematic passes universal validation", () => {
  assert.deepEqual(errorsFor(validPayload()), []);
});

test("P3 duplicate schematic node IDs are rejected", () => {
  const payload = validPayload();
  schematicOf(payload).nodes[1].id = "source-a";

  assert.match(errorsFor(payload).join("\n"), /nodes\[1\]\.id duplicated: source-a/);
});

test("P3 duplicate edge IDs are rejected", () => {
  const payload = validPayload();
  schematicOf(payload).edges.push({
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
  schematicOf(payload).nodes[0].x = Number.NaN;
  schematicOf(payload).nodes[0].y = -1;
  schematicOf(payload).nodes[1].x = 101;

  const errors = errorsFor(payload).join("\n");
  assert.match(errors, /nodes\[0\]\.x must be finite within 0\.\.100/);
  assert.match(errors, /nodes\[0\]\.y must be finite within 0\.\.100/);
  assert.match(errors, /nodes\[1\]\.x must be finite within 0\.\.100/);
});

test("P3 dangling schematic edge endpoint is rejected", () => {
  const payload = validPayload();
  schematicOf(payload).edges[0].to = "missing-node";

  assert.match(
    errorsFor(payload).join("\n"),
    /edges\[0\]\.to references unknown node: missing-node/,
  );
});

test("P3 self-loop schematic edge is rejected", () => {
  const payload = validPayload();
  schematicOf(payload).edges[0].to = "source-a";

  assert.match(errorsFor(payload).join("\n"), /edges\[0\] self-loop not allowed/);
});

test("P3 empty schematic sources are rejected", () => {
  const payload = validPayload();
  schematicOf(payload).sources = [];

  assert.match(
    errorsFor(payload).join("\n"),
    /schematic\.sources is required and must be non-empty/,
  );
});

test("P3 explicit empty node and edge sources are rejected while absent sources inherit schematic provenance", () => {
  const inherited = validPayload();
  delete schematicOf(inherited).nodes[1].sources;
  assert.deepEqual(errorsFor(inherited), []);

  const emptyNodeSources = validPayload();
  schematicOf(emptyNodeSources).nodes[0].sources = [];
  assert.match(
    errorsFor(emptyNodeSources).join("\n"),
    /nodes\[0\]\.sources present but empty or malformed/,
  );

  const emptyEdgeSources = validPayload();
  schematicOf(emptyEdgeSources).edges[0].sources = [];
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


function applicabilitySystemsFixture(): AircraftSystemsContent {
  return {
    aircraftId: "test-aircraft",
    title: "Aircraft systems",
    systems: [
      {
        id: "applicability-system",
        title: "Applicability System",
        summary: "Generic system for nested applicability filtering.",
        schematic: {
          version: 1,
          sources: [source],
          nodes: [
            {
              id: "always",
              label: "Always",
              role: "source",
              x: 10,
              y: 50,
            },
            {
              id: "variant-x",
              label: "Variant X",
              role: "component",
              x: 50,
              y: 30,
              applicability: { variants: ["X"] },
            },
            {
              id: "variant-y",
              label: "Variant Y",
              role: "consumer",
              x: 90,
              y: 70,
              applicability: { variants: ["Y"] },
            },
          ],
          edges: [
            {
              id: "edge-x",
              from: "always",
              to: "variant-x",
              direction: "forward",
              applicability: { variants: ["X"] },
            },
            {
              id: "edge-y",
              from: "always",
              to: "variant-y",
              direction: "forward",
              applicability: { variants: ["Y"] },
            },
            {
              id: "edge-always",
              from: "always",
              to: "variant-x",
              direction: "none",
            },
          ],
        },
      },
    ],
  };
}

test("P3 nested schematic node applicability filters against configuration", () => {
  const filtered = filterSystemsForConfiguration(
    applicabilitySystemsFixture(),
    configurationForVariant("X"),
  );

  assert.deepEqual(
    filtered.systems[0]?.schematic?.nodes.map((node) => node.id),
    ["always", "variant-x"],
  );
});

test("P3 nested schematic edge applicability filters against configuration", () => {
  const filtered = filterSystemsForConfiguration(
    applicabilitySystemsFixture(),
    configurationForVariant("X"),
  );

  assert.deepEqual(
    filtered.systems[0]?.schematic?.edges.map((edge) => edge.id),
    ["edge-x", "edge-always"],
  );
});

test("P3 edge whose endpoint is filtered out is removed", () => {
  const content: AircraftSystemsContent = {
    aircraftId: "test-aircraft",
    title: "Aircraft systems",
    systems: [
      {
        id: "dangling-cleanup",
        title: "Dangling Cleanup",
        summary: "Generic system for endpoint cleanup.",
        schematic: {
          version: 1,
          sources: [source],
          nodes: [
            {
              id: "node-a",
              label: "Node A",
              role: "source",
              x: 10,
              y: 50,
            },
            {
              id: "node-b",
              label: "Node B",
              role: "consumer",
              x: 90,
              y: 50,
              applicability: { variants: ["X"] },
            },
          ],
          edges: [
            {
              id: "a-to-b",
              from: "node-a",
              to: "node-b",
              direction: "forward",
            },
          ],
        },
      },
    ],
  };

  const filtered = filterSystemsForConfiguration(
    content,
    configurationForVariant("Y"),
  );

  assert.deepEqual(
    filtered.systems[0]?.schematic?.nodes.map((node) => node.id),
    ["node-a"],
  );
  assert.deepEqual(filtered.systems[0]?.schematic?.edges, []);
});


test("P3 systems search indexes schematic user-visible text but not layout metadata", () => {
  const system: AircraftSystemsContent["systems"][number] = {
    id: "fuel",
    title: "Fuel",
    summary: "Fuel storage and delivery.",
    schematic: {
      version: 1,
      title: "Fuel System",
      description: "Low pressure fuel delivery",
      sources: [source],
      nodes: [
        {
          id: "fuel-pump",
          label: "Fuel Pump",
          role: "component",
          x: 42,
          y: 17,
          summary: "Engine-driven",
        },
        {
          id: "fuel-manifold",
          label: "Fuel Manifold",
          role: "consumer",
          x: 88,
          y: 64,
        },
      ],
      edges: [
        {
          id: "fuel-supply",
          from: "fuel-pump",
          to: "fuel-manifold",
          direction: "forward",
          label: "supply",
        },
      ],
    },
  };

  const search = systemSearchText(system);

  assert.match(search, /fuel system/);
  assert.match(search, /low pressure fuel delivery/);
  assert.match(search, /fuel pump/);
  assert.match(search, /engine-driven/);
  assert.match(search, /supply/);

  assert.doesNotMatch(search, /\b42\b/);
  assert.doesNotMatch(search, /\b17\b/);
  assert.doesNotMatch(search, /fuel-pump/);
  assert.doesNotMatch(search, /fuel-supply/);
});
