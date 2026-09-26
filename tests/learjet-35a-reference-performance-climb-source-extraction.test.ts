import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

type ClimbRow = number[];

type ClimbTable = {
  schemaVersion: number;
  page: string;
  weightLb: number;
  rows: ClimbRow[];
};

type Manifest = {
  schemaVersion: number;
  status: string;
  id: string;
  source: {
    manualId: string;
    currentChange: string;
    pageLabels: string[];
    effectivity: string;
  };
  schedule: {
    atOrBelow32000Ft: { speed: number; unit: string };
    above32000Ft: { speed: number; unit: string };
  };
  temperatureOrderIsaDeviationC: number[];
  tupleOrder: string[];
  tables: Array<{
    page: string;
    weightLb: number;
    file: string;
    publishedTemperatureTuples: number;
  }>;
  constraints: {
    operationalUseBlocked: boolean;
    interpolationAuthorized: boolean;
    extrapolationAllowed: boolean;
  };
  extractionCorrections: unknown[];
};

const base = new URL(
  "../aircraft-data/learjet-35a/reference-performance/source-extracts/climb-two-engine/",
  import.meta.url,
);

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(new URL(file, base), "utf8")) as T;
}

const manifest = loadJson<Manifest>("manifest.json");
const tables = manifest.tables.map((entry) => ({
  entry,
  table: loadJson<ClimbTable>(entry.file),
}));

const expectedAltitudesFt = Array.from({ length: 23 }, (_, index) => 45000 - index * 2000);

function row(page: string, altitudeFt: number): ClimbRow {
  const table = tables.find(({ table }) => table.page === page)?.table;
  assert.ok(table, `missing climb table ${page}`);
  const found = table.rows.find((candidate) => candidate[0] === altitudeFt);
  assert.ok(found, `missing ${page} / ${altitudeFt} ft row`);
  return found;
}

test("15.2b climb source extract stays CL-102B-bound and explicitly non-operational", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.status, "source-extract-only");
  assert.equal(manifest.id, "learjet-35a-climb-two-engine-source");
  assert.equal(manifest.source.manualId, "CL-102B");
  assert.equal(manifest.source.currentChange, "Change 2 · May 2008");
  assert.equal(manifest.source.effectivity, "ALL");
  assert.equal(manifest.constraints.operationalUseBlocked, true);
  assert.equal(manifest.constraints.interpolationAuthorized, false);
  assert.equal(manifest.constraints.extrapolationAllowed, false);
});

test("15.2b preserves the complete P-19 through P-28 page and weight inventory", () => {
  assert.deepEqual(
    manifest.source.pageLabels,
    ["P-19", "P-20", "P-21", "P-22", "P-23", "P-24", "P-25", "P-26", "P-27", "P-28"],
  );
  assert.deepEqual(
    manifest.tables.map(({ weightLb }) => weightLb),
    [18300, 18000, 17000, 16000, 15000, 14000, 13000, 12000, 11000, 10000],
  );

  for (const { entry, table } of tables) {
    assert.equal(table.schemaVersion, 1);
    assert.equal(table.page, entry.page);
    assert.equal(table.weightLb, entry.weightLb);
  }
});

test("15.2b keeps the published climb schedule and temperature/tuple ordering explicit", () => {
  assert.deepEqual(manifest.schedule.atOrBelow32000Ft, { speed: 250, unit: "KIAS" });
  assert.deepEqual(manifest.schedule.above32000Ft, { speed: 0.7, unit: "MI" });
  assert.deepEqual(manifest.temperatureOrderIsaDeviationC, [-10, 0, 10, 15, 20]);
  assert.deepEqual(manifest.tupleOrder, ["timeMin", "distanceNm", "fuelLb"]);
});

test("15.2b every weight table preserves all 23 published altitude rows and sparse trailing cells", () => {
  for (const { table } of tables) {
    assert.equal(table.rows.length, expectedAltitudesFt.length);
    assert.deepEqual(
      table.rows.map((sourceRow) => sourceRow[0]),
      expectedAltitudesFt,
    );

    for (const sourceRow of table.rows) {
      const publishedValues = sourceRow.length - 1;
      assert.equal(publishedValues % 3, 0);
      assert.ok(publishedValues >= 0 && publishedValues <= 15);
      for (const value of sourceRow.slice(1)) {
        assert.equal(Number.isFinite(value), true);
      }
    }
  }

  assert.deepEqual(row("P-19", 45000), [45000]);
  assert.deepEqual(row("P-19", 43000), [43000]);
  assert.deepEqual(row("P-20", 45000), [45000]);
  assert.equal(row("P-26", 45000).length, 10);
});

test("15.2b published temperature tuple counts remain source-exact", () => {
  let total = 0;
  for (const { entry, table } of tables) {
    const tupleCount = table.rows.reduce(
      (sum, sourceRow) => sum + (sourceRow.length - 1) / 3,
      0,
    );
    assert.equal(tupleCount, entry.publishedTemperatureTuples);
    total += tupleCount;
  }
  assert.equal(total, 1079);
});

test("15.2b exact source nodes survive digitization across the weight envelope", () => {
  assert.deepEqual(
    row("P-19", 41000),
    [41000, 16.5, 98.0, 570.9, 23.7, 146.2, 718.6],
  );
  assert.deepEqual(
    row("P-20", 43000),
    [43000, 22.0, 134.2, 670.3],
  );
  assert.deepEqual(
    row("P-24", 45000),
    [45000, 13.8, 83.1, 436.4, 19.4, 120.9, 533.5],
  );
  assert.deepEqual(
    row("P-28", 45000),
    [45000, 8.3, 49.0, 274.3, 10.4, 63.4, 312.4, 14.2, 90.0, 377.8, 17.8, 114.4, 433.3, 24.4, 161.2, 530.1],
  );
});

test("15.2b visually reviewed PDF text ambiguities are locked to the rendered source", () => {
  assert.deepEqual(
    row("P-23", 5000),
    [5000, 0.9, 3.6, 47.7, 0.9, 4.1, 50.7, 1.2, 5.1, 57.2, 1.3, 5.9, 61.5, 1.5, 6.7, 66.7],
  );
  assert.deepEqual(
    row("P-25", 5000),
    [5000, 0.7, 3.1, 40.5, 0.8, 3.5, 43.1, 1.0, 4.3, 48.4, 1.1, 4.9, 51.8, 1.3, 5.7, 56.0],
  );
  assert.deepEqual(
    row("P-26", 45000),
    [45000, 10.6, 63.5, 346.6, 13.8, 84.9, 402.9, 20.9, 133.7, 518.9],
  );
  assert.equal(manifest.extractionCorrections.length, 3);
});

test("15.2b source extract remains outside operational Takeoff/Landing and Reference runtime registration", () => {
  const performancePackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const inventorySource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/reference-performance/source-inventory.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(performancePackage, /climb-two-engine-source/);
  assert.doesNotMatch(performancePackage, /reference-performance\/source-extracts/);
  assert.doesNotMatch(inventorySource, /p19\.json|manifest\.json/);
});
