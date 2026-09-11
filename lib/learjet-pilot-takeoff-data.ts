import { learjet3536FlightReadyLimitations, learjet3536FlightReadyPerformance } from "./learjet-pilot-landing-data.ts";
import type { AircraftLimitationsContent, AircraftPerformanceContent, PerformanceDataset, TrainingSourceReference } from "./universal-aircraft-content.ts";

const FSI = "fsi-learjet-35-36-ptm-r1-1";
const CAE = "cae-simuflite-learjet-35-36-crh-feb-2007";
const fsi = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: FSI, chapter: "20", section, pageLabel });
const cae = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: CAE, section, pageLabel });

const assumedTemperatures = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
const partialPowerByOat: Readonly<Record<number, readonly number[]>> = {
  80: [93.2, 90.8],
  70: [94.4, 92.1, 89.9],
  60: [95.6, 93.5, 91.3, 89.0],
  50: [96.6, 94.6, 92.6, 90.4, 88.1],
  40: [97.4, 95.8, 93.7, 91.8, 89.6, 87.2],
  30: [97.9, 96.4, 94.7, 92.8, 90.9, 88.7, 86.4],
  20: [98.3, 96.9, 95.3, 93.8, 91.8, 90.0, 87.9, 85.6],
  10: [98.5, 97.2, 95.9, 94.4, 92.8, 90.9, 89.0, 86.9, 84.6],
  0: [98.8, 97.6, 96.3, 94.9, 93.4, 91.8, 90.0, 88.1, 85.9, 83.6],
  [-10]: [97.5, 96.4, 95.2, 93.9, 92.4, 90.7, 88.9, 87.1, 85.0, 82.8],
  [-20]: [96.5, 95.5, 94.4, 92.9, 91.3, 89.7, 87.9, 86.1, 84.1, 82.0],
  [-30]: [95.5, 94.4, 93.2, 91.8, 90.3, 88.7, 86.9, 85.1, 83.1, 81.0],
  [-40]: [94.5, 93.4, 92.2, 90.9, 89.3, 87.7, 85.9, 84.1, 82.1, 80.0],
};

const partialPowerRows = Object.entries(partialPowerByOat).flatMap(([oatText, values]) => {
  const oat = Number(oatText);
  const firstAssumed = oat >= 10 ? oat + 10 : 10;
  const allowedAssumed = assumedTemperatures.filter((value) => value >= firstAssumed);
  return values.map((n1, index) => ({ inputs: { oat, assumedTemperature: allowedAssumed[index] }, outputs: { n1 } }));
});

const takeoffDatasets: readonly PerformanceDataset[] = [
  {
    id: "fsi-partial-power-takeoff-table-20-7",
    title: "Partial-power takeoff N1 — Table 20-7",
    description: "FlightSafety partial-power takeoff determination table for aircraft with TR-4000 thrust reversers. Select actual OAT and the assumed temperature already established from the takeoff-speed/distance chart.",
    kind: "lookup-table",
    axes: [
      { key: "oat", label: "Actual OAT", unit: "°F", values: Object.keys(partialPowerByOat).map(Number).sort((a, b) => a - b) },
      { key: "assumedTemperature", label: "Assumed temperature", unit: "°F", values: assumedTemperatures },
    ],
    outputs: [{ key: "n1", label: "Reduced takeoff N1", unit: "%" }],
    rows: partialPowerRows,
    interpolation: "none",
    notes: [
      "Table is limited by the source to pressure altitudes up to 3,000 ft; above 3,000 ft use the FAA-approved AFM.",
      "Partial-power takeoff is permitted by this training reference only on hard-paved dry runway, bleed-air anti-ice OFF and anti-skid ON/operative.",
      "Thrust reduction may not exceed 25% of rated takeoff thrust for the ambient conditions.",
      "A full rated-thrust takeoff must have been accomplished within the preceding 30 days per the source procedure.",
    ],
    sources: [fsi("Partial Power Takeoff Procedure — Table 20-7", "20-22–20-23")],
  },
  {
    id: "fsi-takeoff-climb-segment-speeds",
    title: "Takeoff climb segment certification cues",
    kind: "reference-table",
    axes: [{ key: "segment", label: "Segment", values: ["First", "Second", "Final", "Enroute", "Approach", "Landing"] }],
    outputs: [{ key: "speedBasis", label: "Speed basis" }, { key: "minimumGradient", label: "Gross gradient" }],
    rows: [
      { inputs: { segment: "First" }, outputs: { speedBasis: "VLOF increasing to V2", minimumGradient: "Positive" } },
      { inputs: { segment: "Second" }, outputs: { speedBasis: "V2", minimumGradient: "2.4%" } },
      { inputs: { segment: "Final" }, outputs: { speedBasis: "1.25 VS1", minimumGradient: "1.2%" } },
      { inputs: { segment: "Enroute" }, outputs: { speedBasis: "Enroute climb-gradient chart", minimumGradient: "No regulatory minimum stated" } },
      { inputs: { segment: "Approach" }, outputs: { speedBasis: "1.3 VS1", minimumGradient: "2.1%" } },
      { inputs: { segment: "Landing" }, outputs: { speedBasis: "1.3 VS0", minimumGradient: "3.2%" } },
    ],
    interpolation: "none",
    sources: [fsi("Climb Segments", "20-6–20-7")],
  },
];

export const learjet3536OperationalPerformance: AircraftPerformanceContent = {
  ...learjet3536FlightReadyPerformance,
  datasets: [...learjet3536FlightReadyPerformance.datasets, ...takeoffDatasets],
};

export const learjet3536OperationalLimitations: AircraftLimitationsContent = {
  ...learjet3536FlightReadyLimitations,
  groups: [
    ...learjet3536FlightReadyLimitations.groups,
    {
      id: "certified-takeoff-weight-reference",
      title: "Certified takeoff weight by configuration",
      items: [
        { id: "mtow-17000", label: "Maximum certified takeoff weight — 17,000 lb configuration", value: 17000, unit: "lb", condition: "CAE: Model 35 without ECR 1495/ECR 2234/AAK 77-8/AAK 80-2; Model 36 not applicable to this row.", sources: [cae("Limitations — Maximum Certified Takeoff Weight", "3-12–3-13")] },
        { id: "mtow-18000", label: "Maximum certified takeoff weight — 18,000 lb configuration", value: 18000, unit: "lb", condition: "Configuration-dependent: AAK 77-8/ECR 1495 on applicable Model 35; Model 36/36A standard combinations as listed by CAE.", sources: [cae("Limitations — Maximum Certified Takeoff Weight", "3-12–3-13")] },
        { id: "mtow-18300", label: "Maximum certified takeoff weight — 18,300 lb configuration", value: 18300, unit: "lb", condition: "Configuration-dependent: AAK 80-2/ECR 2234 or later Model 36/36A effectivity as listed by CAE.", sources: [cae("Limitations — Maximum Certified Takeoff Weight", "3-12–3-13")] },
        { id: "ramp-delta", label: "Maximum ramp weight above allowable takeoff weight", value: 250, unit: "lb", sources: [cae("Limitations — Weight Limitations", "3-12")] },
      ],
      sources: [cae("Limitations — Weight Limitations", "3-12–3-13")],
    },
    {
      id: "partial-power-takeoff-boundaries",
      title: "Partial-power takeoff — use boundaries",
      items: [
        { id: "ppt-runway", label: "Runway surface", value: "Hard-paved and dry only", sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")] },
        { id: "ppt-antiice", label: "Bleed-air anti-ice", value: "OFF", sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")] },
        { id: "ppt-antiskid", label: "Anti-skid", value: "ON and operative", sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")] },
        { id: "ppt-max-reduction", label: "Maximum thrust reduction", value: 25, unit: "% rated takeoff thrust", sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")] },
        { id: "ppt-full-power-history", label: "Full-rated takeoff recency", value: "within preceding 30 days", sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")] },
        { id: "ppt-table-altitude", label: "Table 20-7 pressure-altitude limit", value: 3000, unit: "ft", condition: "Above this altitude the source directs the crew to the FAA-approved AFM.", sources: [fsi("Partial Power Takeoff Determination — Table 20-7", "20-22")] },
      ],
      sources: [fsi("Partial Power Takeoff Procedure", "20-22–20-23")],
    },
  ],
};
