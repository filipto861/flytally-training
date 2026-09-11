import { learjet3536CompleteLimitations, learjet3536CompletePerformance } from "./learjet-pilot-data.ts";
import type { AircraftLimitationsContent, AircraftPerformanceContent, PerformanceDataset, TrainingSourceReference } from "./universal-aircraft-content.ts";

const FSI = "fsi-learjet-35-36-ptm-r1-1";
const CAE = "cae-simuflite-learjet-35-36-crh-feb-2007";

const fsi = (chapter: number, section: string, pageLabel: string): TrainingSourceReference => ({
  manualId: FSI,
  chapter: String(chapter),
  section,
  pageLabel,
});
const cae = (section: string, pageLabel: string): TrainingSourceReference => ({ manualId: CAE, section, pageLabel });

const descentRows = [
  [45, 14.5, 92, 169, 16.4, 109, 285], [44, 14.2, 89, 166, 16.0, 106, 282],
  [43, 13.8, 87, 162, 15.7, 104, 278], [42, 13.5, 84, 158, 15.3, 101, 275],
  [41, 13.2, 82, 154, 15.0, 99, 271], [40, 12.8, 79, 149, 14.7, 96, 267],
  [39, 12.5, 76, 145, 14.4, 94, 262], [38, 12.2, 74, 140, 14.0, 91, 257],
  [37, 11.8, 71, 135, 13.7, 88, 252],
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

const holdingRows = [
  [18000, 194, 214, 1179, 1171, 1163, 1156, 1127, 1109],
  [17000, 187, 207, 1115, 1106, 1088, 1069, 1062, 1043],
  [16000, 180, 200, 1040, 1031, 1012, 1004, 997, 978],
  [15000, 174, 194, 975, 945, 937, 929, 932, 913],
  [14000, 167, 187, 911, 879, 862, 853, 867, 848],
  [13000, 160, 180, 847, 805, 786, 778, 813, 793],
  [12000, 154, 174, 782, 741, 721, 713, 737, 717],
  [11000, 147, 167, 729, 677, 657, 648, 672, 652],
  [10000, 140, 160, 675, 634, 603, 583, 607, 587],
] as const;

const exactOperationalDatasets: readonly PerformanceDataset[] = [
  {
    id: "fsi-descent-performance-table-20-11",
    title: "Descent performance — Table 20-11 exact published rows",
    description: "FlightSafety Table 20-11 for an average 12,000 lb descent weight. The source omits some intermediate altitude rows; FlyTally stores only rows that are explicitly present in the table extraction and does not interpolate them.",
    kind: "reference-table",
    axes: [{ key: "altitude", label: "Starting altitude", unit: "1,000 ft", values: descentRows.map((row) => row[0]) }],
    outputs: [
      { key: "minFuelTime", label: "Minimum-fuel time", unit: "min" },
      { key: "minFuelDistance", label: "Minimum-fuel distance", unit: "NM" },
      { key: "minFuel", label: "Minimum-fuel fuel", unit: "lb" },
      { key: "normalTime", label: "Normal-descent time", unit: "min" },
      { key: "normalDistance", label: "Normal-descent distance", unit: "NM" },
      { key: "normalFuel", label: "Normal-descent fuel", unit: "lb" },
    ],
    rows: descentRows.map(([altitude, minFuelTime, minFuelDistance, minFuel, normalTime, normalDistance, normalFuel]) => ({
      inputs: { altitude },
      outputs: { minFuelTime, minFuelDistance, minFuel, normalTime, normalDistance, normalFuel },
    })),
    interpolation: "none",
    notes: [
      "Minimum-fuel schedule: 3,000 ft/min at MMO to 31,000 ft; 4,000 ft/min at 300 KIAS to 10,000 ft; 3,000 ft/min at 250 KIAS to sea level.",
      "Normal schedule: 3,000 ft/min at MMO/VMO to 10,000 ft; 3,000 ft/min at 250 KIAS to sea level.",
      "Average descent weight in the published table is 12,000 lb.",
    ],
    sources: [fsi(20, "Descent Performance — Table 20-11", "20-28–20-29")],
  },
  {
    id: "fsi-holding-operations-table-20-13",
    title: "Holding operations — Table 20-13",
    description: "Published holding speeds and total fuel flow. The source prints one holding speed for the 5–20 kft block and a second speed for the 25–30 kft block at each gross weight; that layout is preserved explicitly.",
    kind: "reference-table",
    axes: [
      { key: "weight", label: "Gross weight", unit: "lb", values: holdingRows.map((row) => row[0]) },
      { key: "altitude", label: "Altitude", unit: "1,000 ft", values: [5, 10, 15, 20, 25, 30] },
    ],
    outputs: [{ key: "holdingSpeed", label: "Holding speed", unit: "KIAS" }, { key: "fuelFlow", label: "Fuel flow", unit: "lb/hr" }],
    rows: holdingRows.flatMap(([weight, lowSpeed, highSpeed, ff5, ff10, ff15, ff20, ff25, ff30]) => [
      { inputs: { weight, altitude: 5 }, outputs: { holdingSpeed: lowSpeed, fuelFlow: ff5 } },
      { inputs: { weight, altitude: 10 }, outputs: { holdingSpeed: lowSpeed, fuelFlow: ff10 } },
      { inputs: { weight, altitude: 15 }, outputs: { holdingSpeed: lowSpeed, fuelFlow: ff15 } },
      { inputs: { weight, altitude: 20 }, outputs: { holdingSpeed: lowSpeed, fuelFlow: ff20 } },
      { inputs: { weight, altitude: 25 }, outputs: { holdingSpeed: highSpeed, fuelFlow: ff25 } },
      { inputs: { weight, altitude: 30 }, outputs: { holdingSpeed: highSpeed, fuelFlow: ff30 } },
    ]),
    interpolation: "none",
    notes: ["The manual states that these speeds maintain a comfortable margin above shaker or low-speed buffet while maneuvering in a hold."],
    sources: [fsi(20, "Holding Operations — Table 20-13", "20-29–20-30")],
  },
  {
    id: "fsi-descent-speed-schedules",
    title: "Descent speed schedules",
    kind: "reference-table",
    axes: [{ key: "schedule", label: "Schedule", values: ["Minimum fuel — high", "Minimum fuel — middle", "Minimum fuel — low", "Normal — high", "Normal — low"] }],
    outputs: [{ key: "target", label: "Target" }],
    rows: [
      { inputs: { schedule: "Minimum fuel — high" }, outputs: { target: "3,000 ft/min at MMO down to 31,000 ft" } },
      { inputs: { schedule: "Minimum fuel — middle" }, outputs: { target: "4,000 ft/min at 300 KIAS down to 10,000 ft" } },
      { inputs: { schedule: "Minimum fuel — low" }, outputs: { target: "3,000 ft/min at 250 KIAS to sea level" } },
      { inputs: { schedule: "Normal — high" }, outputs: { target: "3,000 ft/min at MMO/VMO down to 10,000 ft" } },
      { inputs: { schedule: "Normal — low" }, outputs: { target: "3,000 ft/min at 250 KIAS to sea level" } },
    ],
    interpolation: "none",
    sources: [fsi(20, "Descent Performance — Table 20-11", "20-28")],
  },
  {
    id: "fsi-cruise-modes-source-coverage",
    title: "Cruise modes provided by the training source",
    description: "FlightSafety states that the airplane checklist/Pilot’s Manual contains separate cruise tables for these four modes. Only exact rows recoverable from the supplied training manual are published numerically in FlyTally; missing chart matrices are not reconstructed from general knowledge.",
    kind: "reference-table",
    axes: [{ key: "mode", label: "Cruise mode", values: ["Two-engine normal", "High-speed", "Long-range", "Single-engine long-range"] }],
    outputs: [{ key: "status", label: "Source status" }],
    rows: [
      { inputs: { mode: "Two-engine normal" }, outputs: { status: "Table 20-10 present; exact worked source example published in FlyTally" } },
      { inputs: { mode: "High-speed" }, outputs: { status: "Referenced by FlightSafety; full numeric chart not reproduced in the supplied extract" } },
      { inputs: { mode: "Long-range" }, outputs: { status: "Referenced by FlightSafety; full numeric chart not reproduced in the supplied extract" } },
      { inputs: { mode: "Single-engine long-range" }, outputs: { status: "Referenced by FlightSafety; full numeric chart not reproduced in the supplied extract" } },
    ],
    interpolation: "none",
    notes: ["Cruise charts are configuration-dependent, including Rosemount/non-Rosemount separation. FlyTally keeps that unresolved rather than merging incompatible tables."],
    sources: [fsi(20, "Cruise Performance", "20-25–20-28")],
  },
];

export const learjet3536ExpandedPerformance: AircraftPerformanceContent = {
  ...learjet3536CompletePerformance,
  title: "Learjet 35/36 Complete Pilot Performance Reference",
  sourceNote: `${learjet3536CompletePerformance.sourceNote} Exact FlightSafety descent and holding tables are also transcribed where the supplied source yields unambiguous tabular values.`,
  datasets: [...learjet3536CompletePerformance.datasets, ...exactOperationalDatasets],
};

export const learjet3536ExpandedLimitations: AircraftLimitationsContent = {
  ...learjet3536CompleteLimitations,
  title: "Learjet 35/36 Complete Pilot Limits & Operating Reference",
  groups: [
    ...learjet3536CompleteLimitations.groups,
    {
      id: "ground-start-electrical-reference",
      title: "Ground power & engine-start operating reference",
      items: [
        { id: "gpu-voltage", label: "GPU regulated voltage", value: 28, unit: "V", condition: "GPU must be current-limited to 1,100 A and capable of at least 500 A.", sources: [fsi(2, "Ground Power", "2-6")] },
        { id: "gpu-overvoltage", label: "GPU overvoltage disconnect threshold", value: 33, unit: "V", condition: "Above this voltage the aircraft overvoltage circuit opens the power relay.", sources: [fsi(2, "Ground Power", "2-6")] },
        { id: "gpu-cold-start", label: "GPU recommended for engine start", value: "OAT 32°F / 0°C or below", sources: [fsi(2, "Ground Power", "2-6")] },
        { id: "start-min-n2", label: "Minimum N2 before thrust lever IDLE", value: 10, unit: "% N2", condition: "Fan rotation should be observed before introducing fuel.", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")] },
        { id: "start-combustion", label: "Combustion indication after selecting IDLE", value: "within 5 sec", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")] },
        { id: "start-oil-pressure", label: "Oil pressure indication after ignition", value: "within 10 sec", condition: "Oil pressure should begin registering at approximately 25% N2.", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")] },
        { id: "start-auto-termination", label: "START / AIR IGN automatic termination", value: "45–50% N2", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")] },
        { id: "spr-use", label: "SPR recommended use", value: "OAT 0°F / -17.8°C or below", condition: "During engine start only; release at 300–400°C ITT.", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")] },
        { id: "start-cooling", label: "Starter cooling sequence after unsuccessful starts", value: "1 min / 1 min / 15 min / 1 min / 1 min / 1 hr", condition: "Wait after start attempts 1 through 6 respectively; the cycle may then be repeated.", sources: [cae("Expanded Normal Procedures — Starting Engines", "2B-30")] },
      ],
      sources: [fsi(2, "Ground Power", "2-6"), cae("Expanded Normal Procedures — Starting Engines", "2B-29–2B-30")],
    },
    {
      id: "hydraulic-reference",
      title: "Hydraulic cockpit reference",
      items: [
        { id: "hyd-normal", label: "Engine-driven hydraulic regulated pressure", value: "1,450–1,550 PSI", sources: [cae("Hydraulic System — Normal Operation", "4G-3–4G-4")] },
        { id: "hyd-reservoir", label: "Hydraulic reservoir pressurization", value: "approximately 17 PSI", sources: [cae("Hydraulic System — Normal Operation", "4G-3–4G-4")] },
        { id: "hyd-res-relief", label: "Reservoir relief", value: 20, unit: "PSI", sources: [cae("Hydraulic System — Normal Operation", "4G-3–4G-4")] },
        { id: "hyd-accumulator", label: "Accumulator nitrogen precharge", value: 850, unit: "PSI", sources: [cae("Hydraulic System — Normal Operation", "4G-3–4G-4")] },
        { id: "hyd-main-relief", label: "Main hydraulic pressure relief", value: 1700, unit: "PSI", sources: [cae("Hydraulic System — Normal Operation", "4G-3–4G-4")] },
        { id: "hyd-aux-standard", label: "Auxiliary pump cycle — standard", value: "ON 1,125 / OFF 1,250 PSI", condition: "Earlier aircraft configuration.", sources: [cae("Hydraulic System — Auxiliary Hydraulic Pump", "4G-4")] },
        { id: "hyd-aux-late", label: "Auxiliary pump cycle — late aircraft", value: "ON 1,000 / OFF 1,125 PSI", condition: "S/N 35-647 and subsequent; 36-059 and subsequent.", sources: [cae("Hydraulic System — Auxiliary Hydraulic Pump", "4G-4")] },
        { id: "hyd-preflight-min", label: "Preflight hydraulic pressure check", value: "1,000 PSI minimum", condition: "If below, CAE expanded normal procedure calls for HYD PUMP ON.", sources: [cae("Expanded Normal Procedures — Before Starting Engines", "2B-8–2B-9")] },
      ],
      sources: [cae("Hydraulic System", "4G-3–4G-5")],
    },
    {
      id: "emergency-air-reference",
      title: "Emergency air / brake reference",
      items: [
        { id: "emergency-air-preflight", label: "Emergency air preflight minimum", value: 1800, unit: "PSI", sources: [cae("Expanded Normal Procedures — Before Starting Engines", "2B-8–2B-9")] },
        { id: "emergency-brake-antiskid", label: "Emergency braking antiskid", value: "NOT AVAILABLE", sources: [fsi(14, "Emergency Brakes", "14-15")], notices: [{ kind: "caution", text: "Differential braking and parking brake capability are also unavailable through the emergency-air braking system." }] },
        { id: "antiskid-low-speed", label: "Antiskid low-speed threshold", value: "8–10 kt / 150 rpm", condition: "Below this wheel speed the antiskid system is inoperative.", sources: [fsi(14, "Antiskid — Operation", "14-14–14-15")] },
      ],
      sources: [cae("Expanded Normal Procedures", "2B-8–2B-9"), fsi(14, "Brakes", "14-12–14-15")],
    },
    {
      id: "pressurization-510-reference",
      title: "510 pressurization — cabin-altitude thresholds",
      items: [
        { id: "510-manual-switch", label: "CAB ALT / automatic-to-manual threshold", value: "8,750 ±250 ft cabin", condition: "CAB ALT light illuminates; mini-controller isolated; manual control until reset.", sources: [cae("Environmental Systems — 510 Pressurization", "4C-12")] },
        { id: "510-reset", label: "Manual pressure aneroid reset", value: 7200, unit: "ft cabin", sources: [cae("Environmental Systems — 510 Pressurization", "4C-12")] },
        { id: "510-emergency", label: "Emergency pressurization actuation", value: "9,500 ±250 ft cabin", sources: [cae("Environmental Systems — 510 Pressurization", "4C-12")], notices: [{ kind: "caution", text: "When emergency pressurization is active, windshield, wing and stabilizer anti-ice bleed air is not available on the applicable later pneumatic configuration." }] },
        { id: "510-horn", label: "Cabin altitude warning horn", value: "10,100 ±250 ft cabin", sources: [cae("Environmental Systems — 510 Pressurization", "4C-12")] },
        { id: "510-limiter", label: "Cabin altitude limiter", value: "11,500 ±1,500 ft cabin", condition: "Outflow valves are driven closed/limited.", sources: [cae("Environmental Systems — 510 Pressurization", "4C-12–4C-13")] },
        { id: "510-emerg-reset", label: "Emergency pressurization valve reset", value: "approximately 8,300 ft cabin", condition: "Applicable later pneumatic configuration; bleed-air switch cycling may be required by the system logic.", sources: [cae("Environmental Systems — Emergency Pressurization", "4C-13")] },
      ],
      sources: [cae("Environmental Systems — 510 Pressurization", "4C-11–4C-13")],
    },
    {
      id: "pressurization-450-reference",
      title: "450 pressurization — cabin-altitude thresholds",
      items: [
        { id: "450-horn-manual", label: "Cabin altitude horn / automatic-to-manual", value: "10,000 ±500 ft cabin", sources: [cae("Environmental Systems — 450 Pressurization", "4C-12–4C-13")] },
        { id: "450-limiter", label: "Cabin altitude limiter", value: "11,500 ±1,500 ft cabin", condition: "CAE 450-system description; FlightSafety notes 11,000 ±1,000 ft on some early aircraft and 11,500 ±1,500 ft on current aircraft.", sources: [cae("Environmental Systems — 450 Pressurization", "4C-12–4C-13"), fsi(12, "Cabin Altitude Limiter", "12-5–12-6")] },
      ],
      sources: [cae("Environmental Systems — 450 Pressurization", "4C-11–4C-13")],
    },
  ],
};
