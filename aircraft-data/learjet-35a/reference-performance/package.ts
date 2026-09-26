import climbManifestJson from "./source-extracts/climb-two-engine/manifest.json" with { type: "json" };
import climbP19Json from "./source-extracts/climb-two-engine/p19.json" with { type: "json" };
import climbP20Json from "./source-extracts/climb-two-engine/p20.json" with { type: "json" };
import climbP21Json from "./source-extracts/climb-two-engine/p21.json" with { type: "json" };
import climbP22Json from "./source-extracts/climb-two-engine/p22.json" with { type: "json" };
import climbP23Json from "./source-extracts/climb-two-engine/p23.json" with { type: "json" };
import climbP24Json from "./source-extracts/climb-two-engine/p24.json" with { type: "json" };
import climbP25Json from "./source-extracts/climb-two-engine/p25.json" with { type: "json" };
import climbP26Json from "./source-extracts/climb-two-engine/p26.json" with { type: "json" };
import climbP27Json from "./source-extracts/climb-two-engine/p27.json" with { type: "json" };
import climbP28Json from "./source-extracts/climb-two-engine/p28.json" with { type: "json" };
import lrcTwoEngineWithRosemountJson from "./source-extracts/long-range-cruise-two-engine-with-rosemount.json" with { type: "json" };
import lrcTwoEngineWithoutRosemountJson from "./source-extracts/long-range-cruise-two-engine-without-rosemount.json" with { type: "json" };
import normalCruiseWithRosemountJson from "./source-extracts/normal-cruise-with-rosemount.json" with { type: "json" };
import normalCruiseWithoutRosemountJson from "./source-extracts/normal-cruise-without-rosemount.json" with { type: "json" };
import lrcOneEngineWithRosemountJson from "./source-extracts/long-range-cruise-one-engine-with-rosemount.json" with { type: "json" };
import lrcOneEngineWithoutRosemountJson from "./source-extracts/long-range-cruise-one-engine-without-rosemount.json" with { type: "json" };

import type { BundledReferencePerformancePackage } from "../../../lib/reference-performance-package.ts";
import type {
  AircraftApplicability,
  PerformanceDataset,
  PerformanceOutput,
  PerformanceRow,
  TrainingSourceReference,
} from "../../../lib/universal-aircraft-content.ts";

type SourceTable = {
  readonly page: string;
  readonly weightLb: number;
  readonly rows: readonly (readonly number[])[];
};

type SourceAnomaly = {
  readonly weightLb: number;
  readonly pressureAltitudeFt: number;
  readonly isaDeviationC: number;
};

type GridExtract = {
  readonly title: string;
  readonly source: {
    readonly pageLabels: readonly string[];
    readonly effectivity?: string;
  };
  readonly temperatureOrderIsaDeviationC: readonly number[];
  readonly axes: {
    readonly weightLb: readonly number[];
    readonly pressureAltitudeFt: readonly number[];
  };
  readonly tables: readonly SourceTable[];
  readonly sourcePrintedAnomalies?: readonly SourceAnomaly[];
};

type NormalCruiseExtract = GridExtract & {
  readonly publishedCruiseMachInd: number;
};

type OneEngineLrcExtract = GridExtract & {
  readonly referenceKindByPressureAltitudeFt: Readonly<Record<string, "machInd" | "kias">>;
};

type ClimbManifest = {
  readonly source: {
    readonly pageLabels: readonly string[];
  };
  readonly temperatureOrderIsaDeviationC: readonly number[];
  readonly tables: readonly {
    readonly page: string;
    readonly weightLb: number;
  }[];
};

type ClimbTable = {
  readonly page: string;
  readonly weightLb: number;
  readonly rows: readonly (readonly number[])[];
};

const climbManifest = climbManifestJson as unknown as ClimbManifest;
const climbTables = [
  climbP19Json,
  climbP20Json,
  climbP21Json,
  climbP22Json,
  climbP23Json,
  climbP24Json,
  climbP25Json,
  climbP26Json,
  climbP27Json,
  climbP28Json,
] as unknown as readonly ClimbTable[];

const lrcTwoEngineWithRosemount =
  lrcTwoEngineWithRosemountJson as unknown as GridExtract;
const lrcTwoEngineWithoutRosemount =
  lrcTwoEngineWithoutRosemountJson as unknown as GridExtract;
const normalCruiseWithRosemount =
  normalCruiseWithRosemountJson as unknown as NormalCruiseExtract;
const normalCruiseWithoutRosemount =
  normalCruiseWithoutRosemountJson as unknown as NormalCruiseExtract;
const lrcOneEngineWithRosemount =
  lrcOneEngineWithRosemountJson as unknown as OneEngineLrcExtract;
const lrcOneEngineWithoutRosemount =
  lrcOneEngineWithoutRosemountJson as unknown as OneEngineLrcExtract;

const axisKeys = ["weightLb", "pressureAltitudeFt", "isaDeviationC"] as const;

const withRosemount: AircraftApplicability = {
  equipmentAllOf: ["rosemount-pitot-static"],
};

const withoutRosemount: AircraftApplicability = {
  equipmentNoneOf: ["rosemount-pitot-static"],
};

function sourceRefs(pageLabels: readonly string[]): readonly TrainingSourceReference[] {
  return pageLabels.map((pageLabel) => ({
    manualId: "CL-102B",
    section: "Performance Data",
    pageLabel,
  }));
}

function anomalyKey(
  weightLb: number,
  pressureAltitudeFt: number,
  isaDeviationC: number,
): string {
  return `${weightLb}:${pressureAltitudeFt}:${isaDeviationC}`;
}

function anomalyKeys(extract: GridExtract): ReadonlySet<string> {
  return new Set(
    (extract.sourcePrintedAnomalies ?? []).map((anomaly) =>
      anomalyKey(
        anomaly.weightLb,
        anomaly.pressureAltitudeFt,
        anomaly.isaDeviationC,
      ),
    ),
  );
}

function makeAxes(extract: GridExtract) {
  return [
    {
      key: "weightLb",
      label: "Gross weight",
      unit: "lb",
      values: extract.axes.weightLb,
    },
    {
      key: "pressureAltitudeFt",
      label: "Pressure altitude",
      unit: "ft",
      values: extract.axes.pressureAltitudeFt,
    },
    {
      key: "isaDeviationC",
      label: "ISA deviation",
      unit: "°C",
      values: extract.temperatureOrderIsaDeviationC,
    },
  ] as const;
}

function expandGridRows(
  extract: GridExtract,
  tupleWidth: number,
  outputsForTuple: (
    tuple: readonly number[],
    pressureAltitudeFt: number,
  ) => Readonly<Record<string, string | number>>,
): readonly PerformanceRow[] {
  const blocked = anomalyKeys(extract);
  const rows: PerformanceRow[] = [];

  for (const table of extract.tables) {
    for (const sourceRow of table.rows) {
      const pressureAltitudeFt = sourceRow[0];
      for (let offset = 1; offset < sourceRow.length; offset += tupleWidth) {
        const tupleIndex = (offset - 1) / tupleWidth;
        const isaDeviationC = extract.temperatureOrderIsaDeviationC[tupleIndex];
        const tuple = sourceRow.slice(offset, offset + tupleWidth);
        if (
          isaDeviationC === undefined
          || tuple.length !== tupleWidth
          || blocked.has(
            anomalyKey(table.weightLb, pressureAltitudeFt, isaDeviationC),
          )
        ) {
          continue;
        }

        rows.push({
          inputs: {
            weightLb: table.weightLb,
            pressureAltitudeFt,
            isaDeviationC,
          },
          outputs: outputsForTuple(tuple, pressureAltitudeFt),
        });
      }
    }
  }

  return rows;
}

function calculator(outputKeys: readonly string[]) {
  return {
    kind: "multi-axis-metric-grid",
    operation: "reference",
    inputAxes: axisKeys,
    outputKeys,
  } as const;
}

function makeCruiseDataset(args: {
  readonly id: string;
  readonly title: string;
  readonly extract: GridExtract;
  readonly outputs: readonly PerformanceOutput[];
  readonly tupleWidth: number;
  readonly outputsForTuple: (
    tuple: readonly number[],
    pressureAltitudeFt: number,
  ) => Readonly<Record<string, string | number>>;
  readonly applicability: AircraftApplicability;
  readonly notes: readonly string[];
}): PerformanceDataset {
  return {
    id: args.id,
    title: args.title,
    description:
      "CL-102B cockpit-reference performance. Bounded interpolation is software-derived only inside complete source rectangles; sparse or reviewed-anomaly support fails closed.",
    kind: "reference-table",
    phase: "reference",
    calculator: calculator(args.outputs.map((output) => output.key)),
    axes: makeAxes(args.extract),
    outputs: args.outputs,
    rows: expandGridRows(
      args.extract,
      args.tupleWidth,
      args.outputsForTuple,
    ),
    interpolation: "linear-explicit",
    applicability: args.applicability,
    notes: args.notes,
    sources: sourceRefs(args.extract.source.pageLabels),
  };
}

const climbAltitudeValues = [
  ...new Set(climbTables.flatMap((table) => table.rows.map((row) => row[0]))),
].sort((left, right) => right - left);

const climbRows: PerformanceRow[] = [];
for (const table of climbTables) {
  for (const sourceRow of table.rows) {
    const pressureAltitudeFt = sourceRow[0];
    for (let offset = 1; offset < sourceRow.length; offset += 3) {
      const tupleIndex = (offset - 1) / 3;
      const isaDeviationC =
        climbManifest.temperatureOrderIsaDeviationC[tupleIndex];
      const tuple = sourceRow.slice(offset, offset + 3);
      if (isaDeviationC === undefined || tuple.length !== 3) continue;
      climbRows.push({
        inputs: {
          weightLb: table.weightLb,
          pressureAltitudeFt,
          isaDeviationC,
        },
        outputs: {
          timeMin: tuple[0],
          distanceNm: tuple[1],
          fuelLb: tuple[2],
        },
      });
    }
  }
}

const climbTwoEngine: PerformanceDataset = {
  id: "reference-climb-two-engine",
  title: "Climb Performance · Two Engine",
  description:
    "Published CL-102B two-engine climb schedule. Results are time, distance and fuel to climb from the source datum to the selected pressure altitude.",
  kind: "reference-table",
  phase: "reference",
  calculator: calculator(["timeMin", "distanceNm", "fuelLb"]),
  axes: [
    {
      key: "weightLb",
      label: "Gross weight",
      unit: "lb",
      values: climbManifest.tables.map((table) => table.weightLb),
    },
    {
      key: "pressureAltitudeFt",
      label: "Pressure altitude",
      unit: "ft",
      values: climbAltitudeValues,
    },
    {
      key: "isaDeviationC",
      label: "ISA deviation",
      unit: "°C",
      values: climbManifest.temperatureOrderIsaDeviationC,
    },
  ],
  outputs: [
    { key: "timeMin", label: "Time", unit: "min" },
    { key: "distanceNm", label: "Distance", unit: "NM" },
    { key: "fuelLb", label: "Fuel", unit: "lb" },
  ],
  rows: climbRows,
  interpolation: "linear-explicit",
  notes: [
    "Published climb schedule: 250 KIAS at or below 32,000 ft; Mach 0.70 indicated above 32,000 ft.",
    "CL-102B marks P-19 through P-28 ALL effectivity.",
    "No extrapolation. Any sparse source corner required by interpolation remains unavailable.",
  ],
  sources: sourceRefs(climbManifest.source.pageLabels),
};

const lrcTwoEngineOutputs: readonly PerformanceOutput[] = [
  { key: "machInd", label: "Mach indicated" },
  { key: "ktas", label: "True airspeed", unit: "KTAS" },
  { key: "specificRangeNmPerLb", label: "Specific range", unit: "NM/lb" },
];

const lrcTwoEngineWithout = makeCruiseDataset({
  id: "reference-lrc-two-engine-without-rosemount",
  title: "Long Range Cruise · Two Engine",
  extract: lrcTwoEngineWithoutRosemount,
  outputs: lrcTwoEngineOutputs,
  tupleWidth: 3,
  outputsForTuple: (tuple) => ({
    machInd: tuple[0],
    ktas: tuple[1],
    specificRangeNmPerLb: tuple[2],
  }),
  applicability: withoutRosemount,
  notes: [
    "Without Rosemount Pitot-Static System.",
    "CL-102B source shading denotes maximum specific range, but the digitized text source does not preserve that shading. No optimum-altitude or maximum-range recommendation is inferred.",
  ],
});

const lrcTwoEngineWith = makeCruiseDataset({
  id: "reference-lrc-two-engine-with-rosemount",
  title: "Long Range Cruise · Two Engine",
  extract: lrcTwoEngineWithRosemount,
  outputs: lrcTwoEngineOutputs,
  tupleWidth: 3,
  outputsForTuple: (tuple) => ({
    machInd: tuple[0],
    ktas: tuple[1],
    specificRangeNmPerLb: tuple[2],
  }),
  applicability: withRosemount,
  notes: [
    "With Rosemount Pitot-Static System.",
    "CL-102B source shading denotes maximum specific range, but the digitized text source does not preserve that shading. No optimum-altitude or maximum-range recommendation is inferred.",
  ],
});

const normalCruiseOutputs: readonly PerformanceOutput[] = [
  { key: "machInd", label: "Published cruise Mach" },
  { key: "ktas", label: "True airspeed", unit: "KTAS" },
  { key: "fuelFlowLbPerHr", label: "Fuel flow", unit: "lb/hr" },
];

function normalCruiseDataset(
  id: string,
  extract: NormalCruiseExtract,
  applicability: AircraftApplicability,
): PerformanceDataset {
  return makeCruiseDataset({
    id,
    title: "Normal Cruise · Two Engine",
    extract,
    outputs: normalCruiseOutputs,
    tupleWidth: 2,
    outputsForTuple: (tuple) => ({
      machInd: extract.publishedCruiseMachInd,
      ktas: tuple[0],
      fuelFlowLbPerHr: tuple[1],
    }),
    applicability,
    notes: [
      extract.source.effectivity ?? "",
      `Published Normal Cruise schedule: Mach ${extract.publishedCruiseMachInd.toFixed(2)} indicated.`,
      "Source-printed anomaly coordinates are retained in the extraction evidence but omitted from the runtime grid, so exact lookup and any interpolation requiring them fail closed.",
    ],
  });
}

const normalCruiseWithout = normalCruiseDataset(
  "reference-normal-cruise-without-rosemount",
  normalCruiseWithoutRosemount,
  withoutRosemount,
);

const normalCruiseWith = normalCruiseDataset(
  "reference-normal-cruise-with-rosemount",
  normalCruiseWithRosemount,
  withRosemount,
);

const oneEngineOutputs: readonly PerformanceOutput[] = [
  { key: "referenceSpeed", label: "Reference speed" },
  { key: "referenceUnit", label: "Reference unit" },
  { key: "ktas", label: "True airspeed", unit: "KTAS" },
  { key: "fuelFlowLbPerHr", label: "Fuel flow", unit: "lb/hr" },
];

function oneEngineDataset(
  id: string,
  extract: OneEngineLrcExtract,
  applicability: AircraftApplicability,
): PerformanceDataset {
  return makeCruiseDataset({
    id,
    title: "Long Range Cruise · One Engine",
    extract,
    outputs: oneEngineOutputs,
    tupleWidth: 3,
    outputsForTuple: (tuple, pressureAltitudeFt) => {
      const kind =
        extract.referenceKindByPressureAltitudeFt[String(pressureAltitudeFt)];
      return {
        referenceSpeed: tuple[0],
        referenceUnit: kind === "machInd" ? "MI" : "KIAS",
        ktas: tuple[1],
        fuelFlowLbPerHr: tuple[2],
      };
    },
    applicability,
    notes: [
      extract.source.effectivity ?? "",
      "The source changes reference-speed semantics by altitude: Mach indicated at 30,000/25,000 ft and KIAS at 20,000/15,000/10,000 ft.",
      "Interpolation across a Mach/KIAS semantic boundary fails closed because referenceUnit differs between required source corners.",
      "Source-printed anomaly coordinates are retained in extraction evidence but omitted from the runtime grid.",
    ],
  });
}

const oneEngineWithout = oneEngineDataset(
  "reference-lrc-one-engine-without-rosemount",
  lrcOneEngineWithoutRosemount,
  withoutRosemount,
);

const oneEngineWith = oneEngineDataset(
  "reference-lrc-one-engine-with-rosemount",
  lrcOneEngineWithRosemount,
  withRosemount,
);

export const learjet35aReferencePerformancePackage: BundledReferencePerformancePackage = {
  aircraftId: "learjet-35a",
  content: {
    aircraftId: "learjet-35a",
    title: "Learjet 35A Reference Performance",
    sourcePolicy: "available-sources",
    sourceNote:
      "Bombardier CL-102B Performance Data. This package is intentionally registered under Reference, not Takeoff/Landing Performance.",
    disclaimer:
      "Reference data from available manufacturer checklist/QRH material. Software interpolation is bounded by complete published source rows and never extrapolates.",
    datasets: [
      climbTwoEngine,
      lrcTwoEngineWithout,
      lrcTwoEngineWith,
      normalCruiseWithout,
      normalCruiseWith,
      oneEngineWithout,
      oneEngineWith,
    ],
  },
};
