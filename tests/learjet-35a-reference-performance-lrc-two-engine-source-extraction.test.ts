import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

type CruiseExtract = {
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
  sourcePresentation: {
    maximumSpecificRangeShadingCaptured: boolean;
    note: string;
  };
};

const base = new URL(
  "../aircraft-data/learjet-35a/reference-performance/source-extracts/",
  import.meta.url,
);

function load(file: string): CruiseExtract {
  return JSON.parse(fs.readFileSync(new URL(file, base), "utf8")) as CruiseExtract;
}

const withoutRosemount = load(
  "long-range-cruise-two-engine-without-rosemount.json",
);
const withRosemount = load(
  "long-range-cruise-two-engine-with-rosemount.json",
);

const expectedWeights = [
  18000, 17500, 17000, 16500, 16000, 15500, 15000, 14500, 14000,
  13500, 13000, 12500, 12000, 11500, 11000, 10500, 10000,
];
const expectedAltitudes = [45000, 43000, 41000, 39000, 37000, 35000];

function table(extract: CruiseExtract, weightLb: number) {
  const found = extract.tables.find((candidate) => candidate.weightLb === weightLb);
  assert.ok(found, `missing ${weightLb} lb table in ${extract.id}`);
  return found;
}

function row(extract: CruiseExtract, weightLb: number, altitudeFt: number) {
  const found = table(extract, weightLb).rows.find(
    (candidate) => candidate[0] === altitudeFt,
  );
  assert.ok(found, `missing ${weightLb} lb / ${altitudeFt} ft row in ${extract.id}`);
  return found;
}

function tupleCount(extract: CruiseExtract): number {
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

test("15.2b two-engine LRC extracts remain source-only and effectivity-separated", () => {
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
  assert.notDeepEqual(
    withoutRosemount.source.pageLabels,
    withRosemount.source.pageLabels,
  );
});

test("15.2b LRC preserves complete published axes and sparse source geometry", () => {
  for (const extract of [withoutRosemount, withRosemount]) {
    assert.deepEqual(extract.temperatureOrderIsaDeviationC, [-10, 0, 10]);
    assert.deepEqual(
      extract.tupleOrder,
      ["machInd", "ktas", "specificRangeNmPerLb"],
    );
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
        assert.equal((sourceRow.length - 1) % 3, 0);
        assert.ok(sourceRow.length >= 1 && sourceRow.length <= 10);
        for (const value of sourceRow.slice(1)) {
          assert.equal(Number.isFinite(value), true);
        }
      }
    }

    assert.equal(tupleCount(extract), 241);
  }

  assert.deepEqual(row(withoutRosemount, 18000, 45000), [45000]);
  assert.deepEqual(row(withoutRosemount, 18000, 43000), [43000]);
  assert.deepEqual(row(withRosemount, 18000, 45000), [45000]);
  assert.deepEqual(row(withRosemount, 18000, 43000), [43000]);
});

test("15.2b LRC exact source nodes survive digitization", () => {
  assert.deepEqual(
    row(withoutRosemount, 18000, 41000),
    [41000, 0.78, 427, 0.351],
  );
  assert.deepEqual(
    row(withoutRosemount, 17000, 39000),
    [39000, 0.742, 408, 0.376, 0.742, 416, 0.365],
  );
  assert.deepEqual(
    row(withoutRosemount, 14000, 45000),
    [45000, 0.77, 424, 0.453],
  );
  assert.deepEqual(
    row(withoutRosemount, 10000, 35000),
    [35000, 0.584, 325, 0.554, 0.584, 333, 0.54, 0.584, 340, 0.525],
  );

  assert.deepEqual(
    row(withRosemount, 18000, 41000),
    [41000, 0.764, 427, 0.351],
  );
  assert.deepEqual(
    row(withRosemount, 14000, 45000),
    [45000, 0.759, 424, 0.453],
  );
  assert.deepEqual(
    row(withRosemount, 10000, 35000),
    [35000, 0.581, 325, 0.554, 0.581, 333, 0.54, 0.581, 340, 0.525],
  );
});

test("15.2b Rosemount split preserves source-distinct indicated Mach without altering KTAS or specific range", () => {
  let comparedTuples = 0;
  let distinctMachTuples = 0;

  for (const weightLb of expectedWeights) {
    for (const altitudeFt of expectedAltitudes) {
      const non = row(withoutRosemount, weightLb, altitudeFt);
      const rose = row(withRosemount, weightLb, altitudeFt);
      assert.equal(non.length, rose.length);

      for (let index = 1; index < non.length; index += 3) {
        const [nonMach, nonKtas, nonRange] = non.slice(index, index + 3);
        const [roseMach, roseKtas, roseRange] = rose.slice(index, index + 3);
        assert.equal(nonKtas, roseKtas);
        assert.equal(nonRange, roseRange);
        if (nonMach !== roseMach) distinctMachTuples += 1;
        comparedTuples += 1;
      }
    }
  }

  assert.equal(comparedTuples, 241);
  assert.ok(distinctMachTuples > 0);
});

test("15.2b does not infer maximum-specific-range shading from text extraction", () => {
  for (const extract of [withoutRosemount, withRosemount]) {
    assert.equal(
      extract.sourcePresentation.maximumSpecificRangeShadingCaptured,
      false,
    );
    assert.match(
      extract.sourcePresentation.note,
      /no maximum-specific-range flag is inferred/i,
    );
  }
});

test("15.2b LRC extracts remain outside operational Performance and Reference runtime registration", () => {
  const performancePackage = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const inventorySource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/reference-performance/source-inventory.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(performancePackage, /long-range-cruise-two-engine/);
  assert.doesNotMatch(performancePackage, /reference-performance\/source-extracts/);
  assert.doesNotMatch(inventorySource, /long-range-cruise-two-engine-without-rosemount\.json/);
  assert.doesNotMatch(inventorySource, /long-range-cruise-two-engine-with-rosemount\.json/);
});
