import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

type NormalCruiseExtract = {
  schemaVersion: number;
  status: string;
  id: string;
  source: {
    manualId: string;
    currentChange: string;
    effectivity: string;
    pageLabels: string[];
  };
  publishedCruiseMachInd: number;
  temperatureOrderIsaDeviationC: number[];
  rowTupleOrder: string[];
  axes: {
    weightLb: number[];
    pressureAltitudeFt: number[];
  };
  tables: Array<{
    page: string;
    weightLb: number;
    rows: number[][];
  }>;
  constraints: {
    operationalUseBlocked: boolean;
    interpolationAuthorized: boolean;
    extrapolationAllowed: boolean;
  };
  sourcePrintedAnomalies: Array<{
    page: string;
    weightLb: number;
    pressureAltitudeFt: number;
    isaDeviationC: number;
    field: string;
    printedValue: number;
  }>;
  normalizationNotes?: Array<{
    page: string;
    numericValue: number;
  }>;
};

const base = new URL(
  "../aircraft-data/learjet-35a/reference-performance/source-extracts/",
  import.meta.url,
);

function load(file: string): NormalCruiseExtract {
  return JSON.parse(fs.readFileSync(new URL(file, base), "utf8")) as NormalCruiseExtract;
}

const withoutRosemount = load("normal-cruise-without-rosemount.json");
const withRosemount = load("normal-cruise-with-rosemount.json");

const expectedWeights = [
  18000, 17500, 17000, 16500, 16000, 15500, 15000, 14500, 14000,
  13500, 13000, 12500, 12000, 11500, 11000, 10500, 10000,
];
const expectedAltitudes = [45000, 43000, 41000, 39000, 37000, 35000, 30000, 25000];

function table(extract: NormalCruiseExtract, weightLb: number) {
  const found = extract.tables.find((candidate) => candidate.weightLb === weightLb);
  assert.ok(found, `missing ${weightLb} lb table in ${extract.id}`);
  return found;
}

function row(extract: NormalCruiseExtract, weightLb: number, altitudeFt: number) {
  const found = table(extract, weightLb).rows.find(
    (candidate) => candidate[0] === altitudeFt,
  );
  assert.ok(found, `missing ${weightLb} lb / ${altitudeFt} ft row in ${extract.id}`);
  return found;
}

function tupleCount(extract: NormalCruiseExtract): number {
  return extract.tables.reduce(
    (tableSum, currentTable) =>
      tableSum
      + currentTable.rows.reduce(
        (rowSum, sourceRow) => rowSum + (sourceRow.length - 1) / 2,
        0,
      ),
    0,
  );
}

test("15.2b Normal Cruise extracts remain source-only and Rosemount-separated", () => {
  for (const extract of [withoutRosemount, withRosemount]) {
    assert.equal(extract.schemaVersion, 1);
    assert.equal(extract.status, "source-extract-only");
    assert.equal(extract.source.manualId, "CL-102B");
    assert.equal(extract.source.currentChange, "Change 2 · May 2008");
    assert.equal(extract.constraints.operationalUseBlocked, true);
    assert.equal(extract.constraints.interpolationAuthorized, false);
    assert.equal(extract.constraints.extrapolationAllowed, false);
  }

  assert.equal(
    withoutRosemount.source.effectivity,
    "Without Rosemount Pitot-Static System",
  );
  assert.equal(
    withRosemount.source.effectivity,
    "With Rosemount Pitot-Static System",
  );
  assert.equal(withoutRosemount.publishedCruiseMachInd, 0.77);
  assert.equal(withRosemount.publishedCruiseMachInd, 0.75);
});

test("15.2b Normal Cruise preserves complete axes and sparse source geometry", () => {
  for (const extract of [withoutRosemount, withRosemount]) {
    assert.deepEqual(extract.temperatureOrderIsaDeviationC, [-10, 0, 10, 15, 20]);
    assert.deepEqual(extract.rowTupleOrder, ["ktas", "fuelFlowLbPerHr"]);
    assert.deepEqual(extract.axes.weightLb, expectedWeights);
    assert.deepEqual(extract.axes.pressureAltitudeFt, expectedAltitudes);
    assert.equal(extract.tables.length, expectedWeights.length);

    for (const currentTable of extract.tables) {
      assert.equal(currentTable.rows.length, expectedAltitudes.length);
      assert.deepEqual(
        currentTable.rows.map((sourceRow) => sourceRow[0]),
        expectedAltitudes,
      );
      for (const sourceRow of currentTable.rows) {
        assert.equal((sourceRow.length - 1) % 2, 0);
        assert.ok(sourceRow.length >= 1 && sourceRow.length <= 11);
        for (const value of sourceRow.slice(1)) {
          assert.equal(Number.isFinite(value), true);
        }
      }
    }

    assert.equal(tupleCount(extract), 442);
  }
});

test("15.2b Normal Cruise exact source nodes survive digitization", () => {
  assert.deepEqual(row(withoutRosemount, 18000, 41000), [41000, 422, 1160]);
  assert.deepEqual(
    row(withoutRosemount, 14000, 35000),
    [35000, 421, 1118, 431, 1168, 440, 1225, 447, 1250, 450, 1280],
  );
  assert.deepEqual(
    row(withRosemount, 10000, 25000),
    [25000, 437, 1495, 446, 1562, 455, 1634, 458, 1662, 464, 1694],
  );
});

test("15.2b Normal Cruise preserves source-printed anomalies instead of silently repairing them", () => {
  assert.deepEqual(
    row(withoutRosemount, 16000, 25000),
    [25000, 437, 1680, 416, 1752, 455, 1824, 458, 1865, 464, 1900],
  );
  assert.deepEqual(
    row(withoutRosemount, 12500, 30000),
    [30000, 428, 1270, 437, 1330, 447, 1390, 452, 421, 456, 1450],
  );
  assert.deepEqual(
    row(withRosemount, 15000, 30000),
    [30000, 28, 1350, 437, 1415, 447, 1478, 452, 1510],
  );

  assert.equal(withoutRosemount.sourcePrintedAnomalies.length, 2);
  assert.equal(withRosemount.sourcePrintedAnomalies.length, 1);
  assert.equal(withRosemount.normalizationNotes?.[0]?.numericValue, 1112);
});

test("15.2b Normal Cruise does not infer equality across effectivities where the printed source differs", () => {
  let identicalRows = 0;
  let differentRows = 0;

  for (const weightLb of expectedWeights) {
    for (const altitudeFt of expectedAltitudes) {
      const non = row(withoutRosemount, weightLb, altitudeFt);
      const rose = row(withRosemount, weightLb, altitudeFt);
      if (JSON.stringify(non) === JSON.stringify(rose)) identicalRows += 1;
      else differentRows += 1;
    }
  }

  assert.ok(identicalRows > 0);
  assert.equal(differentRows, 3);
});

test("15.2b Normal Cruise extracts remain outside operational Performance and Reference runtime registration", () => {
  const performancePackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const inventorySource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/reference-performance/source-inventory.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(performancePackage, /normal-cruise-without-rosemount/);
  assert.doesNotMatch(performancePackage, /normal-cruise-with-rosemount/);
  assert.doesNotMatch(performancePackage, /reference-performance\/source-extracts/);
  assert.doesNotMatch(inventorySource, /normal-cruise-without-rosemount\.json/);
  assert.doesNotMatch(inventorySource, /normal-cruise-with-rosemount\.json/);
});
