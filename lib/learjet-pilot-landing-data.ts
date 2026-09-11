import { learjet3536PracticalLimitations, learjet3536PracticalPerformance } from "./learjet-pilot-data-practical.ts";
import type { AircraftLimitationsContent, AircraftPerformanceContent, PerformanceDataset, TrainingSourceReference } from "./universal-aircraft-content.ts";

const FSI = "fsi-learjet-35-36-ptm-r1-1";
const fsi = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: FSI, chapter: "20", section, pageLabel });

const landingSpeeds = [
  [10000, 105, 111], [11000, 110, 116], [12000, 115, 121], [13000, 119, 126],
  [14000, 123, 130], [15000, 127, 135], [15300, 129, 136],
] as const;

const landingDatasets: readonly PerformanceDataset[] = [
  {
    id: "fsi-approach-landing-speeds-table-20-17",
    title: "VREF / VAPP — FlightSafety Table 20-17",
    description: "Primary training-reference landing speed table. VREF is 1.3 VS0; approach-climb VAPP is 1.3 VS1 and is used for the single-engine approach-climb weight limit.",
    kind: "lookup-table",
    axes: [{ key: "weight", label: "Landing weight", unit: "lb", values: landingSpeeds.map((row) => row[0]) }],
    outputs: [{ key: "vref", label: "VREF / landing-climb speed", unit: "KIAS" }, { key: "vapp", label: "Approach-climb VAPP", unit: "KIAS" }],
    rows: landingSpeeds.map(([weight, vref, vapp]) => ({ inputs: { weight }, outputs: { vref, vapp } })),
    interpolation: "none",
    notes: ["Source conditions: dry runway, zero wind, zero runway gradient, anti-ice OFF, anti-skid ON.", "Use the applicable AFM/aircraft table for controlling operational computation."],
    sources: [fsi("Landing Approach Speed (VREF) / Approach Climb Speed (VAPP) — Table 20-17", "20-37")],
  },
  {
    id: "fsi-final-approach-speed-additives",
    title: "Final-approach minimum speed by configuration",
    description: "FlightSafety Chapter 20 configuration increments relative to VREF. For maneuvering/before final approach, add a further 10 KIAS to the listed final-approach minimum.",
    kind: "reference-table",
    axes: [{ key: "configuration", label: "Configuration", values: ["One or both spoilers up", "No flaps", "Flaps 8°", "Flaps 20°", "Flaps 40°"] }],
    outputs: [{ key: "minimum", label: "Minimum final approach" }],
    rows: [
      { inputs: { configuration: "One or both spoilers up" }, outputs: { minimum: "VREF + 40 KIAS" } },
      { inputs: { configuration: "No flaps" }, outputs: { minimum: "VREF + 30 KIAS" } },
      { inputs: { configuration: "Flaps 8°" }, outputs: { minimum: "VREF + 20 KIAS" } },
      { inputs: { configuration: "Flaps 20°" }, outputs: { minimum: "VREF + 10 KIAS" } },
      { inputs: { configuration: "Flaps 40°" }, outputs: { minimum: "VREF" } },
    ],
    interpolation: "none",
    notes: ["For maneuvering and before final approach, FlightSafety says to add 10 KIAS to these speeds."],
    sources: [fsi("Landing Approach Speed (VREF)", "20-37")],
  },
  {
    id: "fsi-landing-contaminant-depths-table-20-15",
    title: "Landing contaminant depth limits — Table 20-15",
    kind: "reference-table",
    axes: [{ key: "contaminant", label: "Contaminant", values: ["Standing water", "Slush", "Loose snow", "Compacted snow", "Wet ice"] }],
    outputs: [{ key: "maximumDepth", label: "Maximum depth" }],
    rows: [
      { inputs: { contaminant: "Standing water" }, outputs: { maximumDepth: "0.75 in / 19.1 mm" } },
      { inputs: { contaminant: "Slush" }, outputs: { maximumDepth: "0.88 in / 22.4 mm" } },
      { inputs: { contaminant: "Loose snow" }, outputs: { maximumDepth: "1.50 in / 38.1 mm" } },
      { inputs: { contaminant: "Compacted snow" }, outputs: { maximumDepth: "No depth value in table" } },
      { inputs: { contaminant: "Wet ice" }, outputs: { maximumDepth: "No depth value in table" } },
    ],
    interpolation: "none",
    sources: [fsi("Landing Contaminant Depths — Table 20-15", "20-36")],
  },
  {
    id: "fsi-landing-distance-factors-table-20-16",
    title: "Landing distance factors — Table 20-16",
    description: "Published multipliers for wet/contaminated landing distance corrections.",
    kind: "lookup-table",
    axes: [{ key: "surface", label: "Runway surface", values: ["Wet", "Standing water", "Slush", "Loose snow", "Compacted snow", "Wet ice"] }],
    outputs: [{ key: "factor", label: "Landing distance factor" }],
    rows: [
      { inputs: { surface: "Wet" }, outputs: { factor: 1.4 } },
      { inputs: { surface: "Standing water" }, outputs: { factor: 2.2 } },
      { inputs: { surface: "Slush" }, outputs: { factor: 2.2 } },
      { inputs: { surface: "Loose snow" }, outputs: { factor: 2.2 } },
      { inputs: { surface: "Compacted snow" }, outputs: { factor: 1.7 } },
      { inputs: { surface: "Wet ice" }, outputs: { factor: 3.9 } },
    ],
    interpolation: "none",
    notes: ["Compacted-snow and wet-ice landing data are valid only at 40°F / 4.4°C and below."],
    sources: [fsi("Landing Distance Factors — Table 20-16", "20-36")],
  },
  {
    id: "fsi-landing-procedure-distance-basis",
    title: "Landing-distance chart technique",
    kind: "reference-table",
    axes: [{ key: "step", label: "Step", values: ["50 ft gate", "Thrust reduction", "Spoilers", "Brakes", "Elevator"] }],
    outputs: [{ key: "action", label: "Source technique" }],
    rows: [
      { inputs: { step: "50 ft gate" }, outputs: { action: "Cross runway threshold/end at VREF, flaps and gear down, on a 2.5°–3° glidepath." } },
      { inputs: { step: "Thrust reduction" }, outputs: { action: "After 50 ft, progressively reduce thrust to IDLE before touchdown." } },
      { inputs: { step: "Spoilers" }, outputs: { action: "After touchdown, extend spoilers immediately." } },
      { inputs: { step: "Brakes" }, outputs: { action: "Apply wheel brakes as soon as practical; continue maximum braking until stopped." } },
      { inputs: { step: "Elevator" }, outputs: { action: "Use nose-up elevator to shift weight to the main gear." } },
    ],
    interpolation: "none",
    sources: [fsi("Landing Procedure / Actual Landing Distance", "20-36")],
  },
];

const linearSourceFormulaDatasetIds = new Set([
  "jaydee-tod-derived-table",
  "jaydee-three-degree-descent-vs",
]);

const flightReadyBaseDatasets: readonly PerformanceDataset[] = learjet3536PracticalPerformance.datasets.map((dataset) =>
  linearSourceFormulaDatasetIds.has(dataset.id)
    ? { ...dataset, interpolation: "linear-explicit" as const }
    : dataset,
);

export const learjet3536FlightReadyPerformance: AircraftPerformanceContent = {
  ...learjet3536PracticalPerformance,
  datasets: [...flightReadyBaseDatasets, ...landingDatasets],
};

export const learjet3536FlightReadyLimitations: AircraftLimitationsContent = {
  ...learjet3536PracticalLimitations,
  groups: [
    ...learjet3536PracticalLimitations.groups,
    {
      id: "landing-certified-weight-reference",
      title: "Landing certification & gradient reference",
      items: [
        { id: "mlw-standard", label: "Maximum certified landing weight — standard", value: 14300, unit: "lb", sources: [fsi("Maximum Certified Landing Weight", "20-31")], notices: [{ kind: "note", text: "Applies to the standard configuration listed by FlightSafety; configuration must be identified before use." }] },
        { id: "mlw-aak80-3", label: "Maximum certified landing weight — AAK 80-3", value: 15300, unit: "lb", condition: "Learjet 35/36 and 35A/36A with AAK 80-3.", sources: [fsi("Maximum Certified Landing Weight", "20-31")] },
        { id: "approach-climb-gradient", label: "Minimum approach-climb gross gradient", value: 2.1, unit: "%", condition: "One engine; flaps 20°; gear UP; takeoff thrust; speed 1.3 VS1.", sources: [fsi("Landing Weight Limit Chart — Approach Climb", "20-31–20-32")] },
        { id: "landing-climb-gradient", label: "Minimum landing-climb gross gradient", value: 3.2, unit: "%", condition: "Two engines; flaps 40°; gear DOWN; takeoff thrust; speed 1.3 VS0.", sources: [fsi("Landing Weight Limit Chart — Landing Climb", "20-31–20-32")] },
        { id: "downhill-gradient-brake-energy", label: "Downhill gradient >2.0% brake-energy correction", value: "subtract 25 lb per 0.1% above 2.0%", condition: "Applicable through 2.4% downhill gradient per source text.", sources: [fsi("Landing Procedure — gradient correction", "20-36")] },
        { id: "uphill-gradient-climb", label: "Uphill gradient >2.0% approach-climb correction", value: "subtract 125 lb per 0.1% above 2.0%", condition: "Applicable through 2.4% gradient per source text.", sources: [fsi("Landing Procedure — gradient correction", "20-36")] },
      ],
      sources: [fsi("Approach and Landing", "20-31–20-37")],
    },
  ],
};
