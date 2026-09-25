import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

const batteryCurrentPriorSerials: AircraftApplicability = {
  anyOf: [
    { serialNumberRanges: [{ prefix: "35-", from: 1, to: 508 }] },
    { serialNumberRanges: [{ prefix: "36-", from: 1, to: 53 }] },
  ],
};

const batteryCurrentLateSerials: AircraftApplicability = {
  anyOf: [
    { serialNumberRanges: [{ prefix: "35-", from: 509 }] },
    { serialNumberRanges: [{ prefix: "36-", from: 54 }] },
  ],
};

const batteryCurrentE6: AircraftApplicability = {
  ...batteryCurrentPriorSerials,
  modificationsNoneOf: ["amk-85-1"],
};

const batteryCurrentE61: AircraftApplicability = {
  anyOf: [
    batteryCurrentLateSerials,
    {
      ...batteryCurrentPriorSerials,
      modificationsAllOf: ["amk-85-1"],
    },
  ],
};

const batteryCurrentFamily: AircraftApplicability = {
  anyOf: [batteryCurrentE6, batteryCurrentE61],
};

const essentialBusPriorSerials: AircraftApplicability = {
  anyOf: [
    { serialNumberRanges: [{ prefix: "35-", from: 1, to: 201 }] },
    { serialNumbers: ["35-205"] },
    { serialNumberRanges: [{ prefix: "36-", from: 1, to: 40 }] },
  ],
};

const essentialBusLateSerials: AircraftApplicability = {
  anyOf: [
    { serialNumberRanges: [{ prefix: "35-", from: 202, to: 204 }] },
    { serialNumberRanges: [{ prefix: "35-", from: 206 }] },
    { serialNumberRanges: [{ prefix: "36-", from: 41 }] },
  ],
};

const essentialBusE7: AircraftApplicability = {
  ...essentialBusPriorSerials,
  modificationsNoneOf: ["amk-78-13"],
};

const essentialBusE71: AircraftApplicability = {
  anyOf: [
    essentialBusLateSerials,
    {
      ...essentialBusPriorSerials,
      modificationsAllOf: ["amk-78-13"],
    },
  ],
};

const essentialBusFamily: AircraftApplicability = {
  anyOf: [essentialBusE7, essentialBusE71],
};

const mappedStage = (
  id: string,
  label: string,
  pageLabel: string,
  section: string,
  sourceText: string,
  applicability: AircraftApplicability,
  steps: AircraftQrhStage["steps"],
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "mapped", sourceText },
  applicability,
  sources: [source(pageLabel, section)],
  steps,
});

const batterySteps = (prefix: string): AircraftQrhStage["steps"] => [
  {
    id: `${prefix}-temperature-condition`,
    kind: "condition",
    branches: [
      {
        id: `${prefix}-bat-140`,
        label: "If BAT 140 Light Illuminates",
        steps: [
          { id: `${prefix}-140-1`, kind: "action", label: "1", text: "BAT TEMP Indicator — MONITOR" },
          { id: `${prefix}-140-2`, kind: "action", label: "2", text: "Affected Battery — OFF" },
          { id: `${prefix}-140-3`, kind: "action", label: "3", text: "Land as soon as practical." },
        ],
      },
      {
        id: `${prefix}-bat-160`,
        label: "If BAT 160 Light Illuminates",
        steps: [
          { id: `${prefix}-160-1`, kind: "action", label: "1", text: "BAT TEMP Indicator — MONITOR" },
          { id: `${prefix}-160-2`, kind: "action", label: "2", text: "Affected Battery — OFF" },
          { id: `${prefix}-160-3`, kind: "action", label: "3", text: "Land as soon as possible." },
        ],
      },
    ],
  },
];

const currentLimiterE6Steps: AircraftQrhStage["steps"] = [
  { id: "current-limiter-e6-1", kind: "action", label: "1", text: "DC Voltmeter — CHECK" },
  {
    id: "current-limiter-e6-threshold",
    kind: "information",
    text: "Both current limiters have failed if battery voltage is 25 volts or less.",
  },
  {
    id: "current-limiter-e6-result",
    kind: "condition",
    branches: [
      {
        id: "current-limiter-e6-one",
        label: "If one current limiter failed",
        steps: [
          { id: "current-limiter-e6-one-a", kind: "action", label: "a", text: "Electrical Load — OBSERVE GENERATOR LIMITS" },
        ],
      },
      {
        id: "current-limiter-e6-both",
        label: "If both current limiters failed",
        steps: [
          { id: "current-limiter-e6-both-a", kind: "action", label: "a", text: "Electrical Load — REDUCE & MONITOR" },
          { id: "current-limiter-e6-both-b", kind: "action", label: "b", text: "Land as soon as practical." },
        ],
      },
    ],
  },
  { id: "current-limiter-e6-3", kind: "action", label: "3", text: "Replace failed current limiter(s) before next flight." },
];

const currentLimiterE61Steps: AircraftQrhStage["steps"] = [
  { id: "current-limiter-e61-1", kind: "action", label: "1", text: "DC Voltmeter — CHECK" },
  {
    id: "current-limiter-e61-threshold",
    kind: "information",
    text: "Both current limiters have failed if battery voltage is 25 volts or less.",
  },
  {
    id: "current-limiter-e61-result",
    kind: "condition",
    branches: [
      {
        id: "current-limiter-e61-one",
        label: "If one current limiter failed",
        steps: [
          { id: "current-limiter-e61-one-a", kind: "action", label: "a", text: "Electrical Load — OBSERVE GENERATOR LIMITS" },
        ],
      },
      {
        id: "current-limiter-e61-both",
        label: "If both current limiters failed",
        steps: [
          { id: "current-limiter-e61-both-a", kind: "action", label: "a", text: "Air Conditioner — OFF" },
          { id: "current-limiter-e61-both-b", kind: "action", label: "b", text: "Windshield Aux Defog (if installed) — OFF" },
          { id: "current-limiter-e61-both-c", kind: "action", label: "c", text: "Recog Light — OFF" },
          { id: "current-limiter-e61-both-d", kind: "action", label: "d", text: "Aux Heat (if installed) — OFF" },
        ],
      },
    ],
  },
  { id: "current-limiter-e61-3", kind: "action", label: "3", text: "Replace failed current limiter(s) before next flight." },
];

const essentialBusE7Steps: AircraftQrhStage["steps"] = [
  { id: "ess-e7-1", kind: "action", label: "1", text: "ESS BUS TIE CB (copilot’s panel) — PULL" },
  { id: "ess-e7-2", kind: "action", label: "2", text: "Essential Bus Load — REDUCE" },
  { id: "ess-e7-2a", kind: "action", label: "a", text: "Autopilot Switch — OFF" },
  { id: "ess-e7-2b", kind: "action", label: "b", text: "Instrument Panel Lights (if conditions permit) — OFF" },
  {
    id: "ess-e7-2c",
    kind: "information",
    label: "c",
    text: "Do not operate the following at the same time: Pitch, Roll & Yaw Trims; Communication Transmissions; Fuel Transfer & Standby Pumps; Flaps; Landing Gear.",
  },
  { id: "ess-e7-3", kind: "action", label: "3", text: "ESS BUS CB — RESET" },
  {
    id: "ess-e7-does-not-hold",
    kind: "condition",
    branches: [
      {
        id: "ess-e7-does-not-hold-branch",
        label: "If ESS BUS CB does not hold",
        steps: [
          { id: "ess-e7-4", kind: "action", label: "4", text: "Wait at least one minute before attempting reset." },
        ],
      },
    ],
  },
  {
    id: "ess-e7-holds",
    kind: "condition",
    branches: [
      {
        id: "ess-e7-holds-branch",
        label: "If ESS BUS CB holds after being reset",
        steps: [
          { id: "ess-e7-5", kind: "action", label: "5", text: "Add loads only as necessary. Do not reset ESS BUS TIE Circuit Breaker." },
        ],
      },
    ],
  },
  {
    id: "ess-e7-opens-again",
    kind: "condition",
    branches: [
      {
        id: "ess-e7-opens-again-branch",
        label: "If ESS BUS CB opens again",
        steps: [
          { id: "ess-e8-6", kind: "action", label: "6", text: "Essential Bus Load — REDUCE" },
          { id: "ess-e8-6a", kind: "action", label: "a", text: "Autopilot Switch — OFF" },
          { id: "ess-e8-6b", kind: "action", label: "b", text: "Both Audio Panels — PH (use headphones)" },
          { id: "ess-e8-6c", kind: "action", label: "c", text: "Instrument Panel Lights — OFF, AS REQ’D" },
          {
            id: "ess-e8-6d",
            kind: "information",
            label: "d",
            text: "Do not operate the following at the same time: Pitch, Roll & Yaw Trims; Communication Transmissions; Fuel Transfer & Standby Pumps; Flaps; Landing Gear.",
          },
          {
            id: "ess-e8-6e",
            kind: "action",
            label: "e",
            text: "Pull the following circuit breakers on the failed essential bus: COMM; S WARN HT; PITOT HT; Yaw Damper.",
          },
          {
            id: "ess-e8-6f",
            kind: "action",
            label: "f",
            text: "Select the following primary or secondary systems for operation from the remaining essential bus: Pitch Trim; ATC Transponder 1 or 2; COMM 1 or COMM 2; Yaw Damper.",
          },
          { id: "ess-e8-6g", kind: "action", label: "g", text: "ESS BUS TIE CB — RESET" },
          {
            id: "ess-e8-cross-check",
            kind: "information",
            text: "Frequently cross-check airspeed/Mach, altitude, and angle-of-attack displays against opposite system. Use reference from system on opposite essential bus if differences exist and icing conditions are present.",
          },
        ],
      },
    ],
  },
];

const essentialBusE71Steps: AircraftQrhStage["steps"] = [
  { id: "ess-e71-1", kind: "action", label: "1", text: "ESS BUS TIE CB (copilot’s panel) — PULL" },
  { id: "ess-e71-2", kind: "action", label: "2", text: "Essential Bus Load — REDUCE" },
  { id: "ess-e71-3", kind: "action", label: "3", text: "ESS BUS CB — RESET" },
  {
    id: "ess-e71-4",
    kind: "information",
    label: "4",
    text: "Do not operate the following at the same time: Pitch, Roll, & Yaw Trims; Fuel Transfer & Standby Pumps; Flaps; Landing Gear.",
  },
  {
    id: "ess-e71-does-not-hold",
    kind: "condition",
    branches: [
      {
        id: "ess-e71-does-not-hold-branch",
        label: "If ESS BUS CB does not hold",
        steps: [
          { id: "ess-e71-5", kind: "action", label: "5", text: "Wait at least one minute before attempting reset." },
        ],
      },
    ],
  },
  {
    id: "ess-e71-holds",
    kind: "condition",
    branches: [
      {
        id: "ess-e71-holds-branch",
        label: "If ESS BUS CB holds after being reset",
        steps: [
          { id: "ess-e71-6", kind: "action", label: "6", text: "Add loads only as necessary. Do not reset ESS BUS TIE Circuit Breaker." },
        ],
      },
    ],
  },
  {
    id: "ess-e71-opens-again",
    kind: "condition",
    branches: [
      {
        id: "ess-e71-opens-again-branch",
        label: "If ESS BUS CB opens again",
        steps: [
          { id: "ess-e71-7", kind: "action", label: "7", text: "Essential Bus Load — REDUCE" },
          { id: "ess-e71-8", kind: "action", label: "8", text: "ESS BUS CB — RESET" },
        ],
      },
    ],
  },
  {
    id: "ess-e71-load-only",
    kind: "condition",
    branches: [
      {
        id: "ess-e71-load-only-branch",
        label: "If ESS BUS CB will not stay closed and it is desired to operate a load connected to that bus only",
        steps: [
          { id: "ess-e71-9", kind: "action", label: "9", text: "Both Affected ESS BUS Loads — REDUCE" },
          { id: "ess-e71-10", kind: "action", label: "10", text: "ESS BUS TIE CB — RESET" },
          {
            id: "ess-e71-11",
            kind: "information",
            label: "11",
            text: "If ESS BUS TIE CB opens, leave it open. Frequently cross-check airspeed/Mach, altitude, and angle-of-attack displays against opposite system. Use reference from system on opposite essential bus if differences exist and icing conditions are present.",
          },
        ],
      },
    ],
  },
];

export const learjet35aQrhEmergencyBatch7ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3U inventory-reconciliation batch.
 *
 * Package-level reconciliation against the CL-102B E-1 index found three
 * Electrical emergency procedures that were not present in QRH.3A–3G:
 * BATTERY OVERHEAT LIGHT(S), CURRENT LIMITER FAILURE and ESSENTIAL BUS
 * FAILURE — DC POWER LOSS. E-6/E-6.1 and E-7/E-8/E-7.1 are represented with
 * their exact serial/AMK effectivity families. Visual source review found no
 * boxed memory items on these pages; annunciator depictions are indications,
 * not memory-item boxes.
 */
export const learjet35aQrhEmergencyBatch7 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — inventory reconciliation batch 7",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3U closes the three Electrical procedures missing from the earlier source batches and preserves the CL-102B E-6/E-6.1 and E-7/E-8/E-7.1 serial/AMK effectivity splits explicitly.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "battery-overheat-lights-nicad-only",
      title: "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
      procedureClass: "emergency",
      category: "Electrical",
      effectivity: {
        kind: "mapped",
        sourceText: "See E-6 and E-6.1 EFFECTIVITY blocks.",
        mappingNote:
          "The source page is selected from exact aircraft serial number and AMK 85-1 incorporation state.",
      },
      applicability: batteryCurrentFamily,
      sources: [
        source("E-6", "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)"),
        source("E-6.1", "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)"),
      ],
      stages: [
        mappedStage(
          "battery-overheat-e6",
          "E-6 source variant",
          "E-6",
          "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
          "35-001 thru 35-508, 36-001 thru 36-053 not incorporating AMK 85-1",
          batteryCurrentE6,
          batterySteps("battery-overheat-e6"),
        ),
        mappedStage(
          "battery-overheat-e6-1",
          "E-6.1 source variant",
          "E-6.1",
          "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
          "35-509 & on, 36-054 & on, and prior aircraft incorporating AMK 85-1",
          batteryCurrentE61,
          batterySteps("battery-overheat-e61"),
        ),
      ],
    },
    {
      id: "current-limiter-failure",
      title: "CURRENT LIMITER FAILURE",
      procedureClass: "emergency",
      category: "Electrical",
      effectivity: {
        kind: "mapped",
        sourceText: "See E-6 and E-6.1 EFFECTIVITY blocks.",
        mappingNote:
          "The source page is selected from exact aircraft serial number and AMK 85-1 incorporation state.",
      },
      applicability: batteryCurrentFamily,
      sources: [
        source("E-6", "CURRENT LIMITER FAILURE"),
        source("E-6.1", "CURRENT LIMITER FAILURE"),
      ],
      stages: [
        mappedStage(
          "current-limiter-e6",
          "E-6 source variant",
          "E-6",
          "CURRENT LIMITER FAILURE",
          "35-001 thru 35-508, 36-001 thru 36-053 not incorporating AMK 85-1",
          batteryCurrentE6,
          currentLimiterE6Steps,
        ),
        mappedStage(
          "current-limiter-e6-1",
          "E-6.1 source variant",
          "E-6.1",
          "CURRENT LIMITER FAILURE",
          "35-509 & on, 36-054 & on, and prior aircraft incorporating AMK 85-1",
          batteryCurrentE61,
          currentLimiterE61Steps,
        ),
      ],
    },
    {
      id: "essential-bus-failure-dc-power-loss",
      title: "ESSENTIAL BUS FAILURE — DC POWER LOSS",
      procedureClass: "emergency",
      category: "Electrical",
      effectivity: {
        kind: "mapped",
        sourceText: "See E-7/E-8 and E-7.1 EFFECTIVITY blocks.",
        mappingNote:
          "The source procedure is selected from exact aircraft serial number and AMK 78-13 incorporation state.",
      },
      applicability: essentialBusFamily,
      sources: [
        source("E-7–E-8", "ESSENTIAL BUS FAILURE — DC POWER LOSS"),
        source("E-7.1", "ESSENTIAL BUS FAILURE — DC POWER LOSS"),
      ],
      stages: [
        mappedStage(
          "essential-bus-e7-e8",
          "E-7/E-8 source variant",
          "E-7–E-8",
          "ESSENTIAL BUS FAILURE — DC POWER LOSS",
          "35-001 thru 35-201 & 35-205; and 36-001 thru 36-040 not incorporating AMK 78-13",
          essentialBusE7,
          essentialBusE7Steps,
        ),
        mappedStage(
          "essential-bus-e7-1",
          "E-7.1 source variant",
          "E-7.1",
          "ESSENTIAL BUS FAILURE — DC POWER LOSS",
          "35-202 thru 35-204, 35-206 & on; 36-041 & on; and prior aircraft incorporating AMK 78-13",
          essentialBusE71,
          essentialBusE71Steps,
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
