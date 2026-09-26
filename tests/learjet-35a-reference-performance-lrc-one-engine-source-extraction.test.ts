import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

type OneEngineLrcExtract = {
  schemaVersion: number;
  status: string;
  id: string;
  source: {
    manualId: string;
    currentChange: string;
    effectivity: string;
    pageLabels: string[];
  };
  temperatureOrderIsaDeviationC: number[];
  tupleOrder: string[];
  referenceKindByPressureAltitudeFt: Record<string, "machInd" | "kias">;
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
    pairedEffectivityValue: number;
  }>;
  textExtractionCorrections?: Array<{
    page: string;
    extractedToken: string;
    reviewedValue: number;
  }>;
};

const base = new URL(
  "../aircraft-data/learjet-35a/reference-performance/source-extracts/",
  import.meta.url,
);

function load(file: string): OneEngineLrcExtract {
  return JSON.parse(fs.readFileSync(new URL(file, base), "utf8")) as OneEngineLrcExtract;
}

const withoutRosemount = load(
  "long-range-cruise-one-engine-without-rosemount.json",
);
const withRosemount = load(
  "long-range-cruise-one-engine-with-rosemount.json",
);

const expectedWeights = [18000,17000,16000,15000,14000,13000,12000,11000,10000];
const expectedAltitudes = [30000,25000,20000,15000,10000];

function table(extract: OneEngineLrcExtract, weightLb: number) {
  const found = extract.tables.find((candidate) => candidate.weightLb === weightLb);
  assert.ok(found, `missing ${weightLb} lb table in ${extract.id}`);
  return found;
}

function row(extract: OneEngineLrcExtract, weightLb: number, altitudeFt: number) {
  const found = table(extract, weightLb).rows.find(
    (candidate) => candidate[0] === altitudeFt,
  );
  assert.ok(found, `missing ${weightLb} lb / ${altitudeFt} ft row in ${extract.id}`);
  return found;
}

function tupleCount(extract: OneEngineLrcExtract): number {
  return extract.tables.reduce(
    (tableSum, currentTable) =>
      tableSum
      + currentTable.rows.reduce(
        (rowSum, sourceRow) => rowSum + (sourceRow.length - 1) / 3,
        0,
      ),
    0,
  );
}

test("15.2b one-engine LRC extracts remain source-only and Rosemount-separated", () => {
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
});

test("15.2b one-engine LRC preserves axes, row speed semantics and sparse source geometry", () => {
  for (const extract of [withoutRosemount, withRosemount]) {
    assert.deepEqual(extract.temperatureOrderIsaDeviationC, [-10,0,10,15,20]);
    assert.deepEqual(
      extract.tupleOrder,
      ["referenceSpeed", "ktas", "fuelFlowLbPerHr"],
    );
    assert.deepEqual(extract.axes.weightLb, expectedWeights);
    assert.deepEqual(extract.axes.pressureAltitudeFt, expectedAltitudes);
    assert.deepEqual(extract.referenceKindByPressureAltitudeFt, {
      "30000": "machInd",
      "25000": "machInd",
      "20000": "kias",
      "15000": "kias",
      "10000": "kias",
    });
    assert.equal(extract.tables.length, expectedWeights.length);

    for (const currentTable of extract.tables) {
      assert.equal(currentTable.rows.length, expectedAltitudes.length);
      assert.deepEqual(
        currentTable.rows.map((sourceRow) => sourceRow[0]),
        expectedAltitudes,
      );
      for (const sourceRow of currentTable.rows) {
        assert.equal((sourceRow.length - 1) % 3, 0);
        assert.ok(sourceRow.length >= 1 && sourceRow.length <= 16);
        for (const value of sourceRow.slice(1)) {
          assert.equal(Number.isFinite(value), true);
        }
      }
    }

    assert.equal(tupleCount(extract), 174);
  }

  assert.deepEqual(row(withoutRosemount, 18000, 30000), [30000]);
  assert.deepEqual(row(withRosemount, 18000, 30000), [30000]);
});

test("15.2b one-engine LRC exact source nodes survive digitization", () => {
  assert.deepEqual(
    row(withoutRosemount, 18000, 25000),
    [25000, 0.537, 309, 1236],
  );
  assert.deepEqual(
    row(withoutRosemount, 15000, 10000),
    [10000,249,276,1047,249,282,1087,249,287,1128,249,289,1148,249,292,1168],
  );
  assert.deepEqual(
    row(withRosemount, 10000, 30000),
    [30000,0.504,289,606,0.504,296,634,0.504,302,661,0.504,305,675,0.504,309,689],
  );
});

test("15.2b one-engine LRC preserves visually verified source-printed anomalies", () => {
  assert.deepEqual(
    row(withoutRosemount, 16000, 25000),
    [25000,0.53,306,1054,0.53,313,1100,0.53,265,1147],
  );
  assert.deepEqual(
    row(withoutRosemount, 16000, 20000),
    [20000,233,303,1048,233,309,1092,233,294,1136],
  );
  assert.equal(withoutRosemount.sourcePrintedAnomalies.length, 2);
  assert.deepEqual(
    withoutRosemount.sourcePrintedAnomalies.map(({printedValue,pairedEffectivityValue}) => [
      printedValue,
      pairedEffectivityValue,
    ]),
    [[265,319],[294,316]],
  );
  assert.equal(withRosemount.sourcePrintedAnomalies.length, 0);
});

test("15.2b one-engine LRC visually reviewed text-extraction correction is explicit", () => {
  assert.equal(withoutRosemount.textExtractionCorrections?.length, 1);
  assert.equal(withoutRosemount.textExtractionCorrections?.[0]?.extractedToken, "l087");
  assert.equal(withoutRosemount.textExtractionCorrections?.[0]?.reviewedValue, 1087);
});

test("15.2b Rosemount split changes reference speed while preserving KTAS/fuel except printed anomalies", () => {
  let comparedTuples = 0;
  let differentReferenceTuples = 0;
  const nonSourceAnomalyCoordinates = new Set([
    "16000:25000:2",
    "16000:20000:2",
  ]);

  for (const weightLb of expectedWeights) {
    for (const altitudeFt of expectedAltitudes) {
      const non = row(withoutRosemount, weightLb, altitudeFt);
      const rose = row(withRosemount, weightLb, altitudeFt);
      assert.equal(non.length, rose.length);

      for (let index = 1, tupleIndex = 0; index < non.length; index += 3, tupleIndex += 1) {
        const [nonReference, nonKtas, nonFuel] = non.slice(index, index + 3);
        const [roseReference, roseKtas, roseFuel] = rose.slice(index, index + 3);
        const key = `${weightLb}:${altitudeFt}:${tupleIndex}`;

        if (!nonSourceAnomalyCoordinates.has(key)) {
          assert.equal(nonKtas, roseKtas);
        }
        assert.equal(nonFuel, roseFuel);

        if (nonReference !== roseReference) differentReferenceTuples += 1;
        comparedTuples += 1;
      }
    }
  }

  assert.equal(comparedTuples, 174);
  assert.ok(differentReferenceTuples > 0);
});

test("15.2b one-engine LRC extracts remain outside operational Performance and Reference runtime registration", () => {
  const performancePackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const inventorySource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/reference-performance/source-inventory.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(performancePackage, /long-range-cruise-one-engine/);
  assert.doesNotMatch(performancePackage, /reference-performance\/source-extracts/);
  assert.doesNotMatch(inventorySource, /long-range-cruise-one-engine-without-rosemount\.json/);
  assert.doesNotMatch(inventorySource, /long-range-cruise-one-engine-with-rosemount\.json/);
});
