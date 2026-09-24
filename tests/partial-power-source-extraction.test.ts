import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  validatePartialPowerN1SourceExtract,
  type PartialPowerN1SourceCell as SourceCell,
  type PartialPowerN1SourceExtract as PartialPowerSourceExtract,
} from "../lib/performance/partial-power-source.ts";

function load(file: string): PartialPowerSourceExtract {
  return JSON.parse(
    fs.readFileSync(
      new URL(
        `../aircraft-data/learjet-35a/performance/source-extracts/${file}`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as PartialPowerSourceExtract;
}

const none = load("partial-power-n1-no-reversers.json");
const aeronca = load("partial-power-n1-aeronca.json");
const tr4000 = load("partial-power-n1-tr4000.json");
const extracts = [none, aeronca, tr4000] as const;

function cell(
  extract: PartialPowerSourceExtract,
  ambientTemperatureF: number,
  assumedTemperatureF: number,
): SourceCell | undefined {
  return extract.cells.find(
    (candidate) =>
      candidate.ambientTemperatureF === ambientTemperatureF
      && candidate.assumedTemperatureF === assumedTemperatureF,
  );
}

test("PP.1 source extracts remain non-operational governed evidence", () => {
  for (const extract of extracts) {
    assert.deepEqual(validatePartialPowerN1SourceExtract(extract), []);
    assert.equal(extract.schemaVersion, 1);
    assert.equal(extract.status, "source-extract-only");
    assert.equal(extract.source.manualId, "CL-102B");
    assert.equal(extract.output.key, "reducedN1");
    assert.equal(extract.output.unit, "%N1");
    assert.equal(extract.output.sourcePrecision, 0.1);
    assert.equal(extract.constraints.antiIce, "OFF");
    assert.equal(extract.constraints.operationalUseBlocked, true);
  }
});

test("PP.1 source validator rejects operationalization and bad source geometry", () => {
  assert.ok(
    validatePartialPowerN1SourceExtract({
      ...none,
      status: "operational",
    }).some((error) => /source-extract-only/.test(error)),
  );

  assert.ok(
    validatePartialPowerN1SourceExtract({
      ...none,
      cells: [
        ...none.cells,
        {
          ambientTemperatureF: 80,
          assumedTemperatureF: 70,
          n1: 96,
        },
      ],
    }).some((error) => /below ambient/.test(error)),
  );

  assert.ok(
    validatePartialPowerN1SourceExtract({
      ...none,
      cells: [
        ...none.cells,
        none.cells[0],
      ],
    }).some((error) => /duplicates coordinate/.test(error)),
  );
});

test("PP.1 preserves the three separate thrust-reverser source schedules", () => {
  assert.equal(none.configuration.thrustReversers, "none");
  assert.equal(none.source.pageLabel, "P-6");
  assert.equal(none.cells.length, 128);

  assert.equal(aeronca.configuration.thrustReversers, "aeronca");
  assert.equal(aeronca.source.pageLabel, "P-6.1");
  assert.equal(aeronca.cells.length, 128);

  assert.equal(tr4000.configuration.thrustReversers, "tr4000");
  assert.equal(tr4000.source.pageLabel, "P-6.2");
  assert.equal(tr4000.cells.length, 94);
});

test("PP.1 exact source nodes survive extraction for all three schedules", () => {
  assert.deepEqual(cell(none, 80, 80), {
    ambientTemperatureF: 80,
    assumedTemperatureF: 80,
    n1: 96.2,
    sourceStyle: "parenthesized",
  });
  assert.equal(cell(none, -40, 40)?.n1, 90.9);
  assert.equal(cell(none, 0, 120)?.n1, 80.7);

  assert.deepEqual(cell(aeronca, 80, 90), {
    ambientTemperatureF: 80,
    assumedTemperatureF: 90,
    n1: 91.9,
    sourceStyle: "parenthesized",
  });
  assert.equal(cell(aeronca, 0, 100)?.n1, 82.9);
  assert.equal(cell(aeronca, -40, 120)?.n1, 76.0);

  assert.equal(cell(tr4000, 80, 90)?.n1, 93.2);
  assert.equal(cell(tr4000, 30, 40)?.n1, 97.9);
  assert.equal(cell(tr4000, -40, 100)?.n1, 80.0);
});

test("PP.1 sparse source geometry is preserved rather than filled", () => {
  for (const extract of extracts) {
    for (const sourceCell of extract.cells) {
      assert.ok(
        sourceCell.assumedTemperatureF >= sourceCell.ambientTemperatureF,
        `${extract.id} contains assumed temperature below ambient`,
      );
    }
  }

  assert.equal(cell(none, 80, 70), undefined);
  assert.equal(cell(aeronca, 70, 60), undefined);

  assert.equal(cell(tr4000, 80, 80), undefined);
  assert.equal(cell(tr4000, 70, 70), undefined);
  assert.equal(cell(tr4000, 10, 10), undefined);
  assert.equal(cell(tr4000, 0, 10)?.n1, 98.8);
});

test("PP.1 parenthesized source cells are preserved without assigning semantics", () => {
  const noneParenthesized = none.cells
    .filter((sourceCell) => sourceCell.sourceStyle === "parenthesized")
    .map((sourceCell) => [sourceCell.ambientTemperatureF, sourceCell.assumedTemperatureF]);
  assert.deepEqual(noneParenthesized, [
    [80, 80],
    [70, 70],
    [60, 60],
    [50, 50],
    [40, 40],
    [30, 30],
    [20, 20],
    [10, 10],
  ]);

  const aeroncaParenthesized = aeronca.cells
    .filter((sourceCell) => sourceCell.sourceStyle === "parenthesized")
    .map((sourceCell) => [sourceCell.ambientTemperatureF, sourceCell.assumedTemperatureF]);
  assert.deepEqual(aeroncaParenthesized, [
    [80, 80],
    [80, 90],
    [70, 70],
    [60, 60],
    [50, 50],
    [40, 40],
    [30, 30],
    [20, 20],
    [10, 10],
  ]);

  assert.equal(
    aeronca.notes.some((note) => /80°F \/ Assumed Temperature 90°F/.test(note)),
    true,
  );
  assert.equal(
    extracts.some((extract) =>
      extract.notes.some((note) => /parenthesized.*valid|invalid.*parenthesized/i.test(note)),
    ),
    false,
  );
});

test("PP.1 source limits are configuration-specific and are not generalized", () => {
  assert.equal(none.constraints.maxN1ReductionPoints, 7.7);
  assert.equal(aeronca.constraints.maxN1ReductionPoints, 7.7);

  assert.equal(tr4000.constraints.maxN1ReductionPoints, null);
  assert.equal(tr4000.constraints.pressureAltitudeLimitFt, 3000);
  assert.equal(
    tr4000.notes.some((note) => /No 7\.7% N1 reduction note is printed/.test(note)),
    true,
  );
});

test("PP.1 source extracts are not registered as operational performance datasets", () => {
  const packageSource = fs.readFileSync(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );
  const takeoffDefinition = fs.readFileSync(
    new URL(
      "../aircraft-data/learjet-35a/performance/takeoff-calculator-definition.ts",
      import.meta.url,
    ),
    "utf8",
  );

  for (const extract of extracts) {
    assert.doesNotMatch(packageSource, new RegExp(extract.id));
    assert.doesNotMatch(takeoffDefinition, new RegExp(extract.id));
  }
});
