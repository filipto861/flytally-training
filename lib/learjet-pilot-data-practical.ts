import { learjet3536ExpandedLimitations, learjet3536ExpandedPerformance } from "./learjet-pilot-data-expanded.ts";
import type { AircraftLimitationsContent, AircraftPerformanceContent, PerformanceDataset, TrainingSourceReference } from "./universal-aircraft-content.ts";

const FSI = "fsi-learjet-35-36-ptm-r1-1";
const CAE = "cae-simuflite-learjet-35-36-crh-feb-2007";
const JAYDEE = "jaydee-learjet-35a-checklist-v1-35-wip1";

const fsi = (chapter: number, section: string, pageLabel: string): TrainingSourceReference => ({ manualId: FSI, chapter: String(chapter), section, pageLabel });
const cae = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: CAE, section, pageLabel });
const jaydee = (section: string, pageLabel: string): TrainingSourceReference => ({
  manualId: JAYDEE,
  section,
  pageLabel,
  note: "Simulator-workflow supplement; JayDee explicitly states that some procedures are intentionally altered from real-world procedures.",
});

const descentRows = [
  [45, 14.5, 92, 169, 16.4, 109, 285], [44, 14.2, 89, 166, 16.0, 106, 282],
  [43, 13.8, 87, 162, 15.7, 104, 278], [42, 13.5, 84, 158, 15.3, 101, 275],
  [41, 13.2, 82, 154, 15.0, 99, 271], [40, 12.8, 79, 149, 14.7, 96, 267],
  [39, 12.5, 76, 145, 14.4, 94, 262], [38, 12.2, 74, 140, 14.0, 91, 257],
  [37, 11.8, 71, 135, 13.7, 88, 252], [36, 11.5, 69, 129, 13.4, 86, 246],
  [35, 11.2, 66, 124, 13.0, 83, 241], [34, 10.9, 63, 118, 12.7, 81, 234],
  [33, 10.5, 61, 112, 12.4, 78, 228], [32, 10.2, 59, 106, 12.0, 75, 220],
  [31, 9.9, 56, 100, 11.7, 73, 214], [30, 9.7, 55, 96, 11.3, 70, 205],
  [29, 9.4, 53, 92, 11.0, 67, 197], [28, 9.2, 51, 88, 10.7, 65, 188],
  [27, 8.9, 49, 85, 10.4, 62, 178], [26, 8.7, 47, 81, 10.0, 59, 169],
  [25, 8.4, 45, 78, 9.7, 57, 158], [24, 8.2, 43, 75, 9.3, 54, 147],
  [23, 7.9, 42, 72, 9.0, 51, 137], [22, 7.6, 40, 70, 8.7, 49, 126],
  [21, 7.4, 38, 67, 8.4, 46, 116], [20, 7.1, 36, 64, 8.0, 44, 105],
  [18, 6.6, 33, 59, 7.3, 39, 86], [16, 6.1, 30, 54, 6.7, 33, 68],
  [14, 5.6, 27, 50, 6.0, 29, 57], [12, 5.1, 24, 45, 5.3, 25, 44],
  [10, 4.6, 21, 40, 4.6, 21, 40], [8, 3.7, 17, 33, 3.7, 17, 33],
  [6, 2.8, 12, 23, 2.8, 12, 23], [4, 1.9, 8, 16, 1.9, 8, 16],
] as const;

const takeoffContaminantDepthRows = [
  ["Standing water", "Moderate", 0.125, 3.0], ["Standing water", "Heavy", 0.25, 6.0],
  ["Slush", "Moderate", 0.15, 3.8], ["Slush", "Heavy", 0.30, 7.6],
  ["Loose snow — wet", "Moderate", 0.25, 6.4], ["Loose snow — wet", "Heavy", 0.50, 12.7],
  ["Loose snow — dry", "Moderate", 0.95, 24.1], ["Loose snow — dry", "Heavy", 1.90, 48.3],
] as const;

const takeoffFactorRows = [
  [10000, 1.4, 1.4, 2.2, 2.3, 1.6, 3.3],
  [11000, 1.4, 1.4, 2.0, 2.3, 1.5, 3.3],
  [12000, 1.4, 1.4, 1.9, 2.3, 1.5, 3.2],
  [13000, 1.3, 1.3, 1.8, 2.3, 1.4, 3.0],
  [14000, 1.2, 1.3, 1.8, 2.2, 1.4, 2.9],
  [15000, 1.2, 1.2, 1.7, 2.2, 1.3, 2.6],
  [16000, 1.2, 1.2, 1.7, 2.0, 1.2, 2.3],
  [17000, 1.2, 1.2, 1.6, 2.0, 1.2, 2.1],
] as const;

const oxygenRows = [
  [40000, 251, 80, 48, 35, 28, 25, 22],
  [35000, 182, 71, 45, 33, 26, 24, 20],
  [30000, 135, 63, 42, 32, 26, 23, 20],
  [25000, 105, 56, 39, 30, 25, 23, 20],
] as const;

const isaRows = [
  [0, 15.0], [1000, 13.0], [2000, 11.0], [3000, 9.1], [4000, 7.1], [5000, 5.1], [6000, 3.1], [7000, 1.1], [8000, -0.8], [9000, -2.8],
  [10000, -4.8], [11000, -6.8], [12000, -8.8], [13000, -10.7], [14000, -12.7], [15000, -14.7], [16000, -16.7], [17000, -18.7], [18000, -20.6], [19000, -22.6],
  [20000, -24.6], [21000, -26.6], [22000, -28.5], [23000, -30.5], [24000, -32.5], [25000, -34.5], [26000, -36.5], [27000, -38.4], [28000, -40.4], [29000, -42.4],
  [30000, -44.4], [31000, -46.3], [32000, -48.3], [33000, -50.3], [34000, -52.3], [35000, -54.2], [36000, -56.2], [37000, -56.5], [38000, -56.5], [39000, -56.5],
  [40000, -56.5], [41000, -56.5], [42000, -56.5], [43000, -56.5],
] as const;

const todRows = [3, 4, 5].flatMap((path) => {
  const factor = path === 3 ? 3 : path === 4 ? 2.5 : 2;
  return Array.from({ length: 90 }, (_, index) => (index + 1) * 500).map((altitude) => ({
    inputs: { altitude, path: `${path}°` },
    outputs: { tod: Math.round(((altitude / 1000) * factor + 10) * 10) / 10 },
  }));
});

const threeDegreeVsRows = Array.from({ length: 29 }, (_, index) => 80 + index * 10).map((groundSpeed) => ({
  inputs: { groundSpeed },
  outputs: { verticalSpeed: groundSpeed * 5 },
}));

const cruiseFuelPer100Rows = Array.from({ length: 11 }, (_, i) => 250 + i * 25).flatMap((groundSpeed) =>
  Array.from({ length: 13 }, (_, j) => 800 + j * 100).map((fuelFlow) => ({
    inputs: { groundSpeed, fuelFlow },
    outputs: { fuelPer100Nm: Math.round((100 / groundSpeed) * fuelFlow) },
  })),
);

const practicalDatasets: readonly PerformanceDataset[] = [
  {
    id: "fsi-descent-performance-table-20-11-complete",
    title: "Descent planning — complete Table 20-11",
    description: "Exact FlightSafety rows for an average 12,000 lb descent weight. Use this for time, no-wind distance and fuel-to-sea-level planning; no interpolation is applied in this table view.",
    kind: "lookup-table",
    axes: [{ key: "altitude", label: "Starting altitude", unit: "1,000 ft", values: descentRows.map((row) => row[0]) }],
    outputs: [
      { key: "minFuelTime", label: "Min-fuel time", unit: "min" }, { key: "minFuelDistance", label: "Min-fuel distance", unit: "NM" }, { key: "minFuel", label: "Min-fuel fuel", unit: "lb" },
      { key: "normalTime", label: "Normal time", unit: "min" }, { key: "normalDistance", label: "Normal distance", unit: "NM" }, { key: "normalFuel", label: "Normal fuel", unit: "lb" },
    ],
    rows: descentRows.map(([altitude, minFuelTime, minFuelDistance, minFuel, normalTime, normalDistance, normalFuel]) => ({ inputs: { altitude }, outputs: { minFuelTime, minFuelDistance, minFuel, normalTime, normalDistance, normalFuel } })),
    interpolation: "none",
    notes: ["Normal: 3,000 ft/min at MMO/VMO to 10,000 ft, then 3,000 ft/min at 250 KIAS to sea level.", "Minimum fuel: 3,000 ft/min at MMO to 31,000 ft; 4,000 ft/min at 300 KIAS to 10,000 ft; 3,000 ft/min at 250 KIAS to sea level."],
    sources: [fsi(20, "Descent Performance — Table 20-11", "20-28–20-29")],
  },
  {
    id: "fsi-takeoff-contaminant-depths-table-20-5",
    title: "Takeoff contaminant classification — Table 20-5",
    kind: "lookup-table",
    axes: [
      { key: "contaminant", label: "Contaminant", values: ["Standing water", "Slush", "Loose snow — wet", "Loose snow — dry"] },
      { key: "classification", label: "Classification", values: ["Moderate", "Heavy"] },
    ],
    outputs: [{ key: "depthIn", label: "Depth", unit: "in" }, { key: "depthMm", label: "Depth", unit: "mm" }],
    rows: takeoffContaminantDepthRows.map(([contaminant, classification, depthIn, depthMm]) => ({ inputs: { contaminant, classification }, outputs: { depthIn, depthMm } })),
    interpolation: "none",
    notes: ["FlightSafety defines >0.125 in / 3 mm standing water as contaminated runway.", "Compacted snow and wet ice do not use the same depth classification table."],
    sources: [fsi(20, "Takeoff From Wet or Contaminated Runways — Table 20-5", "20-14–20-15")],
  },
  {
    id: "fsi-takeoff-distance-factors-table-20-6",
    title: "Takeoff distance factors — Table 20-6",
    description: "Multiply corrected dry takeoff field length by the applicable published factor. Whenever takeoff field length is corrected, FlightSafety also requires V1 correction from the applicable takeoff-speed chart.",
    kind: "lookup-table",
    axes: [{ key: "weight", label: "Takeoff weight", unit: "lb", values: takeoffFactorRows.map((row) => row[0]) }],
    outputs: [
      { key: "wet8", label: "Wet — flaps 8°" }, { key: "wet20", label: "Wet — flaps 20°" }, { key: "moderate", label: "Contaminated — moderate" },
      { key: "heavy", label: "Contaminated — heavy" }, { key: "compactedSnow", label: "Compacted snow" }, { key: "wetIce", label: "Wet ice" },
    ],
    rows: takeoffFactorRows.map(([weight, wet8, wet20, moderate, heavy, compactedSnow, wetIce]) => ({ inputs: { weight }, outputs: { wet8, wet20, moderate, heavy, compactedSnow, wetIce } })),
    interpolation: "none",
    notes: ["Wet runway: flaps 8° or 20°. Contaminated runway: flaps 20°.", "Contaminated-runway data assumes no tailwind; runway gradient -2% to +2%. Wet-ice gradient 0% to +2%.", "Only rows unambiguously recoverable from the supplied source extraction are stored here."],
    sources: [fsi(20, "Takeoff Distance Factors — Table 20-6", "20-15")],
  },
  {
    id: "cae-oxygen-duration-high-altitude",
    title: "Oxygen duration — high-altitude chart values",
    description: "CAE oxygen-duration chart values at the full-system reference pressure. For a partially charged system CAE gives: duration = chart duration × (system pressure / 1,850).",
    kind: "lookup-table",
    axes: [
      { key: "cabinAltitude", label: "Cabin altitude", unit: "ft", values: oxygenRows.map((row) => row[0]) },
      { key: "occupancy", label: "Occupancy", values: ["2 crew", "2 crew + 2 pax", "2 crew + 4 pax", "2 crew + 6 pax", "2 crew + 8 pax", "2 crew + 9 pax", "2 crew + 11 pax"] },
    ],
    outputs: [{ key: "duration", label: "Available time", unit: "min" }],
    rows: oxygenRows.flatMap(([cabinAltitude, c2, p2, p4, p6, p8, p9, p11]) => [
      ["2 crew", c2], ["2 crew + 2 pax", p2], ["2 crew + 4 pax", p4], ["2 crew + 6 pax", p6], ["2 crew + 8 pax", p8], ["2 crew + 9 pax", p9], ["2 crew + 11 pax", p11],
    ].map(([occupancy, duration]) => ({ inputs: { cabinAltitude, occupancy }, outputs: { duration } }))),
    interpolation: "none",
    notes: ["Bold/light values in the source distinguish 100% oxygen from diluter-demand use. This dataset includes only rows whose extracted values are unambiguous.", "For less than full pressure: multiply the chart time by system pressure / 1,850."],
    sources: [cae("Oxygen System — Oxygen Duration Chart", "4J-6")],
  },
  {
    id: "cae-isa-temperature-reference",
    title: "ISA temperature by pressure altitude",
    kind: "lookup-table",
    axes: [{ key: "altitude", label: "Pressure altitude", unit: "ft", values: isaRows.map((row) => row[0]) }],
    outputs: [{ key: "isaTemperature", label: "ISA temperature", unit: "°C" }],
    rows: isaRows.map(([altitude, isaTemperature]) => ({ inputs: { altitude }, outputs: { isaTemperature } })),
    interpolation: "none",
    sources: [cae("Flight Planning — International Standard Atmosphere", "8-10")],
  },
  {
    id: "jaydee-tod-derived-table",
    title: "Top-of-descent distance — source-formula table · supplementary",
    description: "Precomputed directly from JayDee's published formula: TOD = altitude/1,000 × A + 10 NM, where A = 3 / 2.5 / 2 for 3° / 4° / 5° respectively.",
    kind: "lookup-table",
    axes: [
      { key: "altitude", label: "Altitude to lose", unit: "ft", values: Array.from({ length: 90 }, (_, index) => (index + 1) * 500) },
      { key: "path", label: "Descent path", values: ["3°", "4°", "5°"] },
    ],
    outputs: [{ key: "tod", label: "TOD distance", unit: "NM" }],
    rows: todRows,
    interpolation: "none",
    applicability: { variants: ["35A"] },
    notes: ["DERIVED FROM SOURCE FORMULA — not an AFM dispatch calculation."],
    sources: [jaydee("II — Performance / TOD", "4")],
  },
  {
    id: "jaydee-three-degree-descent-vs",
    title: "3° descent vertical-speed cue · supplementary",
    description: "JayDee instrument-landing workflow gives approximately 5 × ground speed for a 3° path. Rows below are direct arithmetic application of that published cue.",
    kind: "lookup-table",
    axes: [{ key: "groundSpeed", label: "Ground speed", unit: "kt", values: threeDegreeVsRows.map((row) => row.inputs.groundSpeed) }],
    outputs: [{ key: "verticalSpeed", label: "Approx. vertical speed", unit: "ft/min" }],
    rows: threeDegreeVsRows,
    interpolation: "none",
    applicability: { variants: ["35A"] },
    notes: ["SIMULATOR-WORKFLOW HEURISTIC. Use published approach guidance and actual flight-path indications as controlling references."],
    sources: [jaydee("III — Normal Procedures / Instrument Landing", "5")],
  },
  {
    id: "fsi-cruise-fuel-per-100nm-derived",
    title: "Cruise fuel per 100 NM — source-formula planning aid",
    description: "FlightSafety states: cruise time = cruise distance / wind-adjusted KTAS; cruise fuel = cruise time × total fuel flow. This grid normalizes that source formula to 100 NM using wind-adjusted cruise speed.",
    kind: "lookup-table",
    axes: [
      { key: "groundSpeed", label: "Wind-adjusted cruise speed", unit: "kt", values: Array.from({ length: 11 }, (_, i) => 250 + i * 25) },
      { key: "fuelFlow", label: "Total fuel flow", unit: "lb/hr", values: Array.from({ length: 13 }, (_, j) => 800 + j * 100) },
    ],
    outputs: [{ key: "fuelPer100Nm", label: "Fuel per 100 NM", unit: "lb" }],
    rows: cruiseFuelPer100Rows,
    interpolation: "none",
    notes: ["DERIVED FROM SOURCE FORMULA. This is a planning convenience, not a substitute for choosing the correct cruise table/configuration first.", "Use total fuel flow from the applicable cruise table and wind-adjusted cruise speed."],
    sources: [fsi(20, "Cruise Performance", "20-25–20-26")],
  },
];

export const learjet3536PracticalPerformance: AircraftPerformanceContent = {
  ...learjet3536ExpandedPerformance,
  title: "Learjet 35/36 FLY Performance & Planning",
  sourceNote: `${learjet3536ExpandedPerformance.sourceNote} Pilot-facing source formulas are materialized as auditable lookup grids where the formula is explicitly stated by the source.`,
  datasets: [
    ...learjet3536ExpandedPerformance.datasets.filter((dataset) => dataset.id !== "fsi-descent-performance-table-20-11"),
    ...practicalDatasets,
  ],
};

export const learjet3536PracticalLimitations: AircraftLimitationsContent = {
  ...learjet3536ExpandedLimitations,
  title: "Learjet 35/36 FLY Quick Reference & Limits",
  groups: [
    ...learjet3536ExpandedLimitations.groups,
    {
      id: "walkaround-measurable-reference",
      title: "Walkaround — measurable serviceability cues",
      items: [
        { id: "nose-strut", label: "Nose gear strut extension — normal operations", value: "2.5–3.5 in", sources: [cae("Preflight Inspection — Left Nose", "2A-2")] },
        { id: "nose-tire-loaded", label: "Nose tire pressure — loaded", value: "104–114 PSI", sources: [cae("Preflight Inspection — Left Nose", "2A-2")] },
        { id: "nose-tire-unloaded", label: "Nose tire pressure — unloaded", value: "105 ±5 PSI", sources: [cae("Preflight Inspection — Left Nose", "2A-2")] },
        { id: "main-tire-17000", label: "Main tire pressure — 17,000 lb MTOGW", value: "146–156 PSI", sources: [cae("Preflight Inspection — Right Wing Root", "2A-4")] },
        { id: "main-tire-18000", label: "Main tire pressure — 18,000 lb MTOGW", value: "157–167 PSI", sources: [cae("Preflight Inspection — Right Wing Root", "2A-4")] },
        { id: "main-tire-18300", label: "Main tire pressure — 18,300 lb MTOGW", value: "161–171 PSI", sources: [cae("Preflight Inspection — Right Wing Root", "2A-4")] },
      ],
      sources: [cae("Preflight Inspection", "2A-2–2A-4")],
    },
    {
      id: "fuel-capacity-operational-reference",
      title: "Fuel capacity & automatic transfer cues",
      items: [
        { id: "fuel-tips", label: "Tip tanks — usable kerosene, both", value: 2390, unit: "lb", sources: [cae("Fuel System Data", "4F-9")] },
        { id: "fuel-wings", label: "Wing tanks — usable kerosene, both", value: 2360, unit: "lb", sources: [cae("Fuel System Data", "4F-9")] },
        { id: "fuel-fuselage-35", label: "Model 35 fuselage tank — usable kerosene", value: 1340, unit: "lb", applicability: { variants: ["35", "35A"] }, sources: [cae("Fuel System Data", "4F-9")] },
        { id: "fuel-fuselage-36", label: "Model 36 fuselage tank — usable kerosene", value: 2542, unit: "lb", applicability: { variants: ["36", "36A"] }, sources: [cae("Fuel System Data", "4F-9")] },
        { id: "fuel-pressure-annun", label: "FUEL PRESS annunciator threshold", value: "below 0.25 PSIG", sources: [cae("Fuel System — Operation", "4F-9")] },
        { id: "fuel-start-pump-cutoff", label: "Fuel computer standby-pump cutoff during start", value: "45% N2", sources: [cae("Fuel System — Operation", "4F-9")] },
      ],
      sources: [cae("Fuel System Data / Operation", "4F-9")],
    },
  ],
};
