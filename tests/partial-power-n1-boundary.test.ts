import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  lookupPartialPowerN1ExactSourceCell,
  lookupPartialPowerN1SourceValue,
} from "../lib/performance/partial-power-n1.ts";
import type {
  PartialPowerN1SourceExtract,
} from "../lib/performance/partial-power-source.ts";

const load = (file: string): PartialPowerN1SourceExtract => JSON.parse(
  fs.readFileSync(
    new URL(
      `../aircraft-data/learjet-35a/performance/source-extracts/${file}`,
      import.meta.url,
    ),
    "utf8",
  ),
) as PartialPowerN1SourceExtract;

const none = load("partial-power-n1-no-reversers.json");
const aeronca = load("partial-power-n1-aeronca.json");
const tr4000 = load("partial-power-n1-tr4000.json");

test("PP.3 exact reduced-N1 lookup preserves a published no-reverser source cell", () => {
  const result = lookupPartialPowerN1ExactSourceCell(none, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 5000,
    antiIce: false,
  });

  assert.equal(result.status, "source-value");
  if (result.status !== "source-value") return;
  assert.equal(result.reducedN1, 93.6);
  assert.equal(result.sourceExtractId, none.id);
  assert.equal(result.sourcePageLabel, "P-6");
  assert.equal(result.sourceCell.sourceStyle, undefined);
});

test("PP.3 configuration-specific schedules remain distinct at the same coordinates", () => {
  const noReverser = lookupPartialPowerN1ExactSourceCell(none, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });
  const withAeronca = lookupPartialPowerN1ExactSourceCell(aeronca, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });
  const withTr4000 = lookupPartialPowerN1ExactSourceCell(tr4000, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(noReverser.status, "source-value");
  assert.equal(withAeronca.status, "source-value");
  assert.equal(withTr4000.status, "source-value");
  if (
    noReverser.status !== "source-value"
    || withAeronca.status !== "source-value"
    || withTr4000.status !== "source-value"
  ) return;

  assert.equal(noReverser.reducedN1, 93.6);
  assert.equal(withAeronca.reducedN1, 91.5);
  assert.equal(withTr4000.reducedN1, 92.6);
});

test("PP.3 unresolved Aeronca parenthesized cell fails closed even above ambient", () => {
  const result = lookupPartialPowerN1ExactSourceCell(aeronca, {
    ambientTemperatureF: 80,
    assumedTemperatureF: 90,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.deepEqual(result, {
    status: "blocked",
    reason: "unresolved-parenthesized-source-cell",
    detail: "The source value is parenthesized and its operational meaning has not been established from an authoritative source.",
  });
});

test("PP.3 equal assumed and ambient temperature is not accepted as reduced thrust", () => {
  const result = lookupPartialPowerN1ExactSourceCell(none, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 50,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "assumed-temperature-not-above-ambient");
});

test("PP.3 exact-only boundary refuses to invent interpolation", () => {
  const result = lookupPartialPowerN1ExactSourceCell(aeronca, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 82,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "exact-source-cell-unavailable");
  assert.match(result.detail ?? "", /Interpolation is not authorized/i);
});

test("PP.3 exact-only boundary refuses ambient-axis interpolation as well", () => {
  const result = lookupPartialPowerN1ExactSourceCell(none, {
    ambientTemperatureF: 55,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "exact-source-cell-unavailable");
});

test("PP.3 anti-ice ON fails closed for all three source schedules", () => {
  for (const extract of [none, aeronca, tr4000]) {
    const result = lookupPartialPowerN1ExactSourceCell(extract, {
      ambientTemperatureF: 50,
      assumedTemperatureF: 80,
      pressureAltitudeFt: 0,
      antiIce: true,
    });
    assert.equal(result.status, "blocked");
    if (result.status !== "blocked") continue;
    assert.equal(result.reason, "anti-ice-on");
  }
});

test("PP.3 TR-4000 source pressure-altitude limit is enforced", () => {
  const atLimit = lookupPartialPowerN1ExactSourceCell(tr4000, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 3000,
    antiIce: false,
  });
  assert.equal(atLimit.status, "source-value");

  const aboveLimit = lookupPartialPowerN1ExactSourceCell(tr4000, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 3001,
    antiIce: false,
  });
  assert.equal(aboveLimit.status, "blocked");
  if (aboveLimit.status !== "blocked") return;
  assert.equal(aboveLimit.reason, "pressure-altitude-limit");
});

test("PP.3 sparse/missing source cells remain unavailable", () => {
  const result = lookupPartialPowerN1ExactSourceCell(tr4000, {
    ambientTemperatureF: 80,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "assumed-temperature-not-above-ambient");

  const sparse = lookupPartialPowerN1ExactSourceCell(tr4000, {
    ambientTemperatureF: 80,
    assumedTemperatureF: 85,
    pressureAltitudeFt: 0,
    antiIce: false,
  });
  assert.equal(sparse.status, "blocked");
  if (sparse.status !== "blocked") return;
  assert.equal(sparse.reason, "exact-source-cell-unavailable");
});

test("PP.3 source boundary does not promote extracts into operational datasets", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../lib/performance/partial-power-n1.ts", import.meta.url),
    "utf8",
  );
  const pkg = await readFile(
    new URL("../aircraft-data/learjet-35a/performance/package.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /exact source-cell lookup only/i);
  assert.doesNotMatch(source, /calculateMultiAxisMetricGrid|calculatePostBaselineTransform/);
  assert.doesNotMatch(pkg, /partial-power-n1-(?:no-reversers|aeronca|tr4000)/);
});


test("PP.3 Aeronca interpolation reproduces the FAA-approved AFMS W1072 worked example", () => {
  const result = lookupPartialPowerN1SourceValue(aeronca, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 82,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "source-value");
  if (result.status !== "source-value") return;

  assert.equal(result.method, "bounded-source-interpolation");
  assert.ok(Math.abs(result.reducedN1 - 91) <= 0.1);
  assert.deepEqual(result.interpolationAuthority, {
    manualId: "AFMS-W1072",
    figure: "5",
    configuration: "aeronca",
  });
  assert.deepEqual(
    result.supportingCells.map((cell) => [
      cell.ambientTemperatureF,
      cell.assumedTemperatureF,
      cell.n1,
    ]),
    [
      [50, 80, 91.5],
      [50, 90, 89.4],
    ],
  );
});

test("PP.3 Aeronca bounded interpolation supports the continuous ambient axis", () => {
  const result = lookupPartialPowerN1SourceValue(aeronca, {
    ambientTemperatureF: 55,
    assumedTemperatureF: 80,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "source-value");
  if (result.status !== "source-value") return;
  assert.equal(result.method, "bounded-source-interpolation");
  assert.ok(Math.abs(result.reducedN1 - 91.95) < 1e-9);
  assert.equal(result.supportingCells.length, 2);
});

test("PP.3 Aeronca interpolation is bilinear only inside a complete published source rectangle", () => {
  const result = lookupPartialPowerN1SourceValue(aeronca, {
    ambientTemperatureF: 55,
    assumedTemperatureF: 85,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "source-value");
  if (result.status !== "source-value") return;
  assert.equal(result.method, "bounded-source-interpolation");
  assert.ok(Math.abs(result.reducedN1 - 90.9) < 1e-9);
  assert.equal(result.supportingCells.length, 4);
});

test("PP.3 Aeronca interpolation fails closed when its support region touches unresolved parentheses", () => {
  const result = lookupPartialPowerN1SourceValue(aeronca, {
    ambientTemperatureF: 75,
    assumedTemperatureF: 85,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "interpolation-source-region-unresolved");
});

test("PP.3 reduced-N1 interpolation remains unauthorized for no-reverser schedule", () => {
  const result = lookupPartialPowerN1SourceValue(none, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 82,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "interpolation-not-authorized");
});

test("PP.3 reduced-N1 interpolation remains unauthorized for TR-4000 schedule", () => {
  const result = lookupPartialPowerN1SourceValue(tr4000, {
    ambientTemperatureF: 50,
    assumedTemperatureF: 82,
    pressureAltitudeFt: 0,
    antiIce: false,
  });

  assert.equal(result.status, "blocked");
  if (result.status !== "blocked") return;
  assert.equal(result.reason, "interpolation-not-authorized");
});

test("PP.3 Aeronca interpolation never extrapolates beyond either temperature axis", () => {
  for (const request of [
    {
      ambientTemperatureF: 85,
      assumedTemperatureF: 100,
      pressureAltitudeFt: 0,
      antiIce: false,
    },
    {
      ambientTemperatureF: 50,
      assumedTemperatureF: 125,
      pressureAltitudeFt: 0,
      antiIce: false,
    },
  ]) {
    const result = lookupPartialPowerN1SourceValue(aeronca, request);
    assert.equal(result.status, "blocked");
    if (result.status !== "blocked") continue;
    assert.equal(result.reason, "interpolation-source-region-incomplete");
  }
});
