import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string, note?: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section,
  pageLabel,
  ...(note ? { note } : {}),
});

const earlyPressurizationSerials: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 1, to: 106 },
    { prefix: "35-", from: 108, to: 112 },
    { prefix: "36-", from: 1, to: 31 },
  ],
};

const latePressurizationSerials: AircraftApplicability = {
  serialNumbers: ["35-107"],
  serialNumberRanges: [
    { prefix: "35-", from: 113 },
    { prefix: "36-", from: 32 },
  ],
};

const emergencyAirflowPriorSerials: AircraftApplicability = {
  serialNumbers: ["35-107"],
  serialNumberRanges: [
    { prefix: "35-", from: 113, to: 658 },
    { prefix: "36-", from: 32, to: 63 },
  ],
};

const emergencyAirflowLaterSerials: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 659 },
    { prefix: "36-", from: 64 },
  ],
};

export const learjet35aQrhEnvironmentalConfigurationKeys = {
  emergencyAirflow: "emergency-airflow",
  amk903: "amk-90-3",
} as const;

const emergencyAirflowOldControls: AircraftApplicability = {
  ...emergencyAirflowPriorSerials,
  modificationsNoneOf: [learjet35aQrhEnvironmentalConfigurationKeys.amk903],
  configurationEquipmentAllOf: [
    learjet35aQrhEnvironmentalConfigurationKeys.emergencyAirflow,
  ],
};

const emergencyAirflowNewControls: AircraftApplicability = {
  anyOf: [
    emergencyAirflowLaterSerials,
    {
      ...emergencyAirflowPriorSerials,
      modificationsAllOf: [learjet35aQrhEnvironmentalConfigurationKeys.amk903],
    },
  ],
  configurationEquipmentAllOf: [
    learjet35aQrhEnvironmentalConfigurationKeys.emergencyAirflow,
  ],
};

const emergencyAirflowInstalled: AircraftApplicability = {
  anyOf: [emergencyAirflowOldControls, emergencyAirflowNewControls],
};

const allAircraftStage = (
  id: string,
  label: string,
  pageLabel: string,
  section: string,
  steps: AircraftQrhStage["steps"],
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "all-aircraft", sourceText: "ALL" },
  sources: [source(pageLabel, section)],
  steps,
});

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

const emergencyAirflowSteps = (
  controls:
    | "mod-valves"
    | "emergency-pressurization",
): AircraftQrhStage["steps"] => [
  {
    id: `emergency-airflow-${controls}-1`,
    kind: "action",
    label: "1",
    text: "Thrust Levers — 90% or BELOW (if practical)",
  },
  ...(controls === "mod-valves"
    ? [
        {
          id: "emergency-airflow-mod-valves-2a",
          kind: "action" as const,
          label: "2",
          text: "LH MOD VAL CB (pilot’s main bus) — IN",
        },
        {
          id: "emergency-airflow-mod-valves-2b",
          kind: "action" as const,
          text: "RH MOD VAL CB (copilot’s main bus) — IN",
        },
      ]
    : [
        {
          id: "emergency-airflow-emergency-pressurization-2a",
          kind: "action" as const,
          label: "2",
          text: "L EMER PRESS CB (pilot’s main bus) — IN",
        },
        {
          id: "emergency-airflow-emergency-pressurization-2b",
          kind: "action" as const,
          text: "R EMER PRESS CB (copilot’s main bus) — IN",
        },
      ]),
  {
    id: `emergency-airflow-${controls}-continues-first`,
    kind: "condition",
    branches: [
      {
        id: `emergency-airflow-${controls}-continues-first-branch`,
        label: "If Emergency Airflow Continues",
        steps: [
          {
            id: `emergency-airflow-${controls}-3`,
            kind: "action",
            label: "3",
            text: "One BLEED AIR Switch — OFF",
          },
          {
            id: `emergency-airflow-${controls}-3-note`,
            kind: "information",
            text: "If emergency airflow stops, leave switch OFF.",
          },
          {
            id: `emergency-airflow-${controls}-continues-second`,
            kind: "condition",
            branches: [
              {
                id: `emergency-airflow-${controls}-continues-second-branch`,
                label: "If Emergency Airflow Continues",
                steps: [
                  {
                    id: `emergency-airflow-${controls}-4a`,
                    kind: "action",
                    label: "4",
                    text: "BLEED AIR Switch — ON",
                  },
                  {
                    id: `emergency-airflow-${controls}-4b`,
                    kind: "action",
                    text: "Other BLEED AIR Switch — OFF",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const learjet35aQrhAbnormalBatch4ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3K Environmental Abnormal Procedures source batch.
 *
 * Covers the complete five-procedure Environmental index family on CL-102B
 * A-14 through A-16.1. Visual source review found no boxed memory items.
 * The legacy comparison glyph rendered by the reviewed PDF on A-16/A-16.1 is
 * normalized to the intended ≤ relation in the staged text and called out in
 * source metadata rather than silently propagated as a corrupted glyph.
 */
export const learjet35aQrhAbnormalBatch4 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 4",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3K source digitization of the complete Environmental abnormal family from CL-102B A-14 through A-16.1. No boxed memory items were found. A-16/A-16.1 comparison glyphs that render/extract as an encoding artifact are normalized to ≤; the batch remains staged source-review content.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "failure-to-depressurize",
      title: "FAILURE TO DEPRESSURIZE",
      procedureClass: "abnormal",
      category: "Environmental",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-14", "FAILURE TO DEPRESSURIZE")],
      stages: [
        allAircraftStage(
          "failure-to-depressurize-a14",
          "A-14",
          "A-14",
          "FAILURE TO DEPRESSURIZE",
          [
            {
              id: "failure-to-depressurize-1",
              kind: "action",
              label: "1",
              text: "Cabin Air — OFF",
            },
            {
              id: "failure-to-depressurize-2",
              kind: "action",
              label: "2",
              text: "Both BLEED AIR Switches — OFF",
            },
          ],
        ),
      ],
    },
    {
      id: "inadvertent-activation-emergency-airflow",
      title: "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW (IF INSTALLED)",
      procedureClass: "abnormal",
      category: "Environmental",
      effectivity: {
        kind: "mapped",
        sourceText:
          "A-14 is ALL; internal control identification depends on serial number and AMK 90-3, and the procedure is explicitly IF INSTALLED.",
        mappingNote:
          "Emergency-airflow installation must be explicit. Prior/current control identification is selected from serial number and AMK 90-3 state; unknown required configuration facts fail closed.",
      },
      applicability: emergencyAirflowInstalled,
      sources: [
        source(
          "A-14",
          "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW (IF INSTALLED)",
        ),
      ],
      stages: [
        mappedStage(
          "emergency-airflow-mod-valves-a14",
          "MOD VAL control source variant",
          "A-14",
          "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW (IF INSTALLED)",
          "35-107 & 35-113 thru 35-658; and 36-032 thru 36-063 not incorporating AMK 90-3",
          emergencyAirflowOldControls,
          emergencyAirflowSteps("mod-valves"),
        ),
        mappedStage(
          "emergency-airflow-emergency-pressurization-a14",
          "EMER PRESS control source variant",
          "A-14",
          "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW (IF INSTALLED)",
          "35-659 & on; 36-064 & on; and prior aircraft incorporating AMK 90-3",
          emergencyAirflowNewControls,
          emergencyAirflowSteps("emergency-pressurization"),
        ),
      ],
    },
    {
      id: "overpressurization",
      title: "OVERPRESSURIZATION",
      procedureClass: "abnormal",
      category: "Environmental",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-14", "OVERPRESSURIZATION")],
      stages: [
        allAircraftStage(
          "overpressurization-a14",
          "A-14",
          "A-14",
          "OVERPRESSURIZATION",
          [
            {
              id: "overpressurization-red-line",
              kind: "condition",
              branches: [
                {
                  id: "overpressurization-red-line-branch",
                  label: "If Differential Pressure Exceeds Red Line",
                  steps: [
                    {
                      id: "overpressurization-1",
                      kind: "action",
                      label: "1",
                      text: "AUTO-MAN Switch — MAN",
                    },
                    {
                      id: "overpressurization-2",
                      kind: "action",
                      label: "2",
                      text: "UP-DN Manual Control — UP AS REQ’D",
                    },
                    {
                      id: "overpressurization-unable",
                      kind: "condition",
                      branches: [
                        {
                          id: "overpressurization-unable-branch",
                          label: "If Unable To Regulate Overpressurization",
                          steps: [
                            {
                              id: "overpressurization-3",
                              kind: "action",
                              label: "3",
                              text: "One BLEED AIR Switch — OFF",
                            },
                            {
                              id: "overpressurization-4",
                              kind: "action",
                              label: "4",
                              text: "Adjust power on opposite engine to control pressurization.",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "cab-alt-light-or-cabin-altitude-exceeds-8500-feet",
      title: "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET",
      procedureClass: "abnormal",
      category: "Environmental",
      effectivity: {
        kind: "mapped",
        sourceText: "A-15/A-15.1 serial-number effectivity",
        mappingNote:
          "The early and late pressurization-system procedures are materially different and remain separate source stages.",
      },
      applicability: {
        anyOf: [earlyPressurizationSerials, latePressurizationSerials],
      },
      sources: [
        source("A-15", "CABIN ALTITUDE EXCEEDS 8500 FEET"),
        source(
          "A-15.1",
          "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET",
        ),
      ],
      stages: [
        mappedStage(
          "cabin-altitude-a15",
          "CABIN ALTITUDE EXCEEDS 8500 FEET — A-15",
          "A-15",
          "CABIN ALTITUDE EXCEEDS 8500 FEET",
          "35-001 thru 35-106, 35-108 thru 35-112; and 36-001 thru 36-031",
          earlyPressurizationSerials,
          [
            {
              id: "cabin-altitude-a15-1",
              kind: "action",
              label: "1",
              text: "Crew Oxygen Masks — DON & SELECT 100%",
            },
            {
              id: "cabin-altitude-a15-2",
              kind: "action",
              label: "2",
              text: "If aircraft is climbing, stop climbing and level off at (or descend to) the nearest appropriate altitude.",
            },
            {
              id: "cabin-altitude-a15-3",
              kind: "action",
              label: "3",
              text: "OXY-MIC Switches — ON",
            },
            {
              id: "cabin-altitude-a15-4",
              kind: "action",
              label: "4",
              text: "Cabin Air — NORM",
            },
            {
              id: "cabin-altitude-a15-5",
              kind: "action",
              label: "5",
              text: "Bleed Air — ON",
            },
            {
              id: "cabin-altitude-a15-6",
              kind: "action",
              label: "6",
              text: "Cabin Altitude — CHECK",
            },
            {
              id: "cabin-altitude-a15-7",
              kind: "condition",
              branches: [
                {
                  id: "cabin-altitude-a15-continues",
                  label: "7. If cabin altitude continues to climb",
                  steps: [
                    {
                      id: "cabin-altitude-a15-7a",
                      kind: "action",
                      label: "a",
                      text: "AUTO-MAN Switch — MAN",
                    },
                    {
                      id: "cabin-altitude-a15-7b",
                      kind: "action",
                      label: "b",
                      text: "UP-DN Manual Control (red) — AS REQ’D",
                    },
                    {
                      id: "cabin-altitude-a15-continues-again",
                      kind: "condition",
                      branches: [
                        {
                          id: "cabin-altitude-a15-continues-again-branch",
                          label: "If cabin altitude continues to climb",
                          steps: [
                            {
                              id: "cabin-altitude-a15-7c",
                              kind: "action",
                              label: "c",
                              text: "Engine RPM — MAINTAIN",
                            },
                            {
                              id: "cabin-altitude-a15-7d",
                              kind: "action",
                              label: "d",
                              text: "IN NORMAL/OUT DEFOG Knob — PUSH IN",
                            },
                            {
                              id: "cabin-altitude-a15-7e",
                              kind: "action",
                              label: "e",
                              text: "Windshield Heat — AUTO",
                            },
                            {
                              id: "cabin-altitude-a15-7f",
                              kind: "action",
                              label: "f",
                              text: "Cabin Air — OFF",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "cabin-altitude-a15-stabilizes",
                  label: "If cabin altitude stabilizes at a safe altitude",
                  steps: [
                    {
                      id: "cabin-altitude-a15-stabilizes-a",
                      kind: "action",
                      label: "a",
                      text: "Continue flight. Continued use of oxygen system is at the crew’s discretion.",
                    },
                    {
                      id: "cabin-altitude-a15-supplement",
                      kind: "information",
                      text: "Refer to Supplemental Data, pages S-8, S-9 and S-10 for oxygen duration charts.",
                    },
                  ],
                },
              ],
            },
          ],
        ),
        mappedStage(
          "cabin-altitude-a15-1",
          "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET — A-15.1",
          "A-15.1",
          "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET",
          "35-107, 35-113 & on; and 36-032 & on",
          latePressurizationSerials,
          [
            {
              id: "cabin-altitude-a151-1",
              kind: "action",
              label: "1",
              text: "Crew Oxygen Masks — DON & SELECT 100%",
            },
            {
              id: "cabin-altitude-a151-2",
              kind: "action",
              label: "2",
              text: "If aircraft is climbing, stop climbing and level off at (or descend to) the nearest appropriate altitude.",
            },
            {
              id: "cabin-altitude-a151-3",
              kind: "action",
              label: "3",
              text: "OXY-MIC Switches — ON",
            },
            {
              id: "cabin-altitude-a151-4",
              kind: "action",
              label: "4",
              text: "Cabin Air — ON",
            },
            {
              id: "cabin-altitude-a151-5",
              kind: "action",
              label: "5",
              text: "Bleed Air — ON",
            },
            {
              id: "cabin-altitude-a151-6",
              kind: "action",
              label: "6",
              text: "Cabin Altitude — CHECK",
            },
            {
              id: "cabin-altitude-a151-7",
              kind: "condition",
              branches: [
                {
                  id: "cabin-altitude-a151-continues",
                  label: "7. If cabin altitude continues to climb",
                  steps: [
                    {
                      id: "cabin-altitude-a151-7a",
                      kind: "action",
                      label: "a",
                      text: "AUTO-MAN Switch — MAN",
                    },
                    {
                      id: "cabin-altitude-a151-7b",
                      kind: "action",
                      label: "b",
                      text: "UP-DN Manual Control (red) — AS REQ’D",
                    },
                    {
                      id: "cabin-altitude-a151-continues-again",
                      kind: "condition",
                      branches: [
                        {
                          id: "cabin-altitude-a151-continues-again-branch",
                          label: "If cabin altitude continues to climb",
                          steps: [
                            {
                              id: "cabin-altitude-a151-7c",
                              kind: "action",
                              label: "c",
                              text: "BLEED AIR Switches — EMER",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "cabin-altitude-a151-stabilizes",
                  label: "If cabin altitude stabilizes at a safe altitude",
                  steps: [
                    {
                      id: "cabin-altitude-a151-stabilizes-a",
                      kind: "action",
                      label: "a",
                      text: "Continue flight. Continued use of oxygen system is at the crew’s discretion.",
                    },
                    {
                      id: "cabin-altitude-a151-hot",
                      kind: "condition",
                      branches: [
                        {
                          id: "cabin-altitude-a151-hot-branch",
                          label:
                            "b. If cabin temperature becomes hot from the use of EMER BLEED AIR",
                          steps: [
                            {
                              id: "cabin-altitude-a151-hot-1",
                              kind: "action",
                              label: "(1)",
                              text: "One BLEED AIR Switch — OFF",
                            },
                            {
                              id: "cabin-altitude-a151-hot-2",
                              kind: "action",
                              label: "(2)",
                              text: "If temperature is still too high, reduce power on engine supplying bleed air.",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: "cabin-altitude-a151-supplement",
                      kind: "information",
                      text: "Refer to Supplemental Data, pages S-8, S-9 and S-10 for oxygen duration charts.",
                    },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "return-to-normal-pressurization",
      title: "RETURN TO NORMAL PRESSURIZATION",
      procedureClass: "abnormal",
      category: "Environmental",
      effectivity: {
        kind: "mapped",
        sourceText: "A-16/A-16.1 serial-number effectivity",
        mappingNote:
          "The early source is titled RETURN TO AUTOMATIC PRESSURIZATION MODE; the late source is titled RETURN TO NORMAL PRESSURIZATION. They remain distinct source stages.",
      },
      applicability: {
        anyOf: [earlyPressurizationSerials, latePressurizationSerials],
      },
      sources: [
        source(
          "A-16",
          "RETURN TO AUTOMATIC PRESSURIZATION MODE",
          "Legacy comparison glyph before 7500 FEET is normalized to ≤ in this staged transcription.",
        ),
        source(
          "A-16.1",
          "RETURN TO NORMAL PRESSURIZATION",
          "Legacy comparison glyph before 7200 FEET is normalized to ≤ in this staged transcription.",
        ),
      ],
      stages: [
        mappedStage(
          "return-pressurization-a16",
          "RETURN TO AUTOMATIC PRESSURIZATION MODE — A-16",
          "A-16",
          "RETURN TO AUTOMATIC PRESSURIZATION MODE",
          "35-001 thru 35-106, 35-108 thru 35-112; and 36-001 thru 36-031",
          earlyPressurizationSerials,
          [
            {
              id: "return-pressurization-a16-1",
              kind: "action",
              label: "1",
              text: "Cabin Controller — ≤7500 FEET (cabin)",
            },
            {
              id: "return-pressurization-a16-2",
              kind: "action",
              label: "2",
              text: "Rate Selector — FULL INCR",
            },
            {
              id: "return-pressurization-a16-3",
              kind: "action",
              label: "3",
              text: "UP-DN Manual Control — SELECTED CABIN ALTITUDE",
            },
            {
              id: "return-pressurization-a16-4",
              kind: "action",
              label: "4",
              text: "Cabin Vertical Speed — ZERO",
            },
            {
              id: "return-pressurization-a16-5",
              kind: "action",
              label: "5",
              text: "Rate Selector — RESET TO NOMINAL",
            },
            {
              id: "return-pressurization-a16-6",
              kind: "action",
              label: "6",
              text: "AUTO-MAN Switch — AUTO",
            },
            {
              id: "return-pressurization-a16-7",
              kind: "action",
              label: "7",
              text: "Cabin Controller — AS REQ’D",
            },
          ],
        ),
        mappedStage(
          "return-pressurization-a16-1",
          "RETURN TO NORMAL PRESSURIZATION — A-16.1",
          "A-16.1",
          "RETURN TO NORMAL PRESSURIZATION",
          "35-107, 35-113 & on; and 36-032 & on",
          latePressurizationSerials,
          [
            {
              id: "return-pressurization-a161-1",
              kind: "action",
              label: "1",
              text: "Cabin Air — ON",
            },
            {
              id: "return-pressurization-a161-2",
              kind: "action",
              label: "2",
              text: "AUTO-MAN Switch — MAN",
            },
            {
              id: "return-pressurization-a161-3",
              kind: "action",
              label: "3",
              text: "UP-DN Manual Control — <7200 FEET (cabin)",
            },
            {
              id: "return-pressurization-a161-4",
              kind: "action",
              label: "4",
              text: "One BLEED AIR Switch — OFF then ON",
            },
            {
              id: "return-pressurization-a161-5",
              kind: "action",
              label: "5",
              text: "Other BLEED AIR Switch — OFF then ON",
            },
            {
              id: "return-pressurization-a161-6",
              kind: "action",
              label: "6",
              text: "UP-DN Manual Control — AS REQ’D",
            },
            {
              id: "return-pressurization-a161-return",
              kind: "information",
              text: "Return to Automatic Mode If Desired",
            },
            {
              id: "return-pressurization-a161-7",
              kind: "action",
              label: "7",
              text: "Cabin Controller — ≤7200 FEET (cabin)",
            },
            {
              id: "return-pressurization-a161-8",
              kind: "action",
              label: "8",
              text: "UP-DN Manual Control — SELECTED CABIN ALTITUDE",
            },
            {
              id: "return-pressurization-a161-9",
              kind: "action",
              label: "9",
              text: "AUTO-MAN Switch — AUTO",
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
