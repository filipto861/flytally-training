import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section,
  pageLabel,
});

export const learjet35aQrhInstrumentsConfigurationKeys = {
  rosemountPitotStaticSystem: "rosemount-pitot-static-system",
} as const;

const withRosemountPitotStatic: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhInstrumentsConfigurationKeys.rosemountPitotStaticSystem,
  ],
};

const withoutRosemountPitotStatic: AircraftApplicability = {
  configurationEquipmentNoneOf: [
    learjet35aQrhInstrumentsConfigurationKeys.rosemountPitotStaticSystem,
  ],
};

const allStage = (
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

const commonPitotStaticSteps = (
  sourceFamily: "with-rosemount" | "without-rosemount",
): AircraftQrhStage["steps"] => [
  {
    id: `pitot-static-${sourceFamily}-intro`,
    kind: "information",
    text: "If pitot-static source malfunction is known or suspected:",
  },
  {
    id: `pitot-static-${sourceFamily}-1`,
    kind: "action",
    label: "1",
    text: "Maintain aircraft control with safe attitude & thrust.",
  },
  {
    id: `pitot-static-${sourceFamily}-2`,
    kind: "action",
    label: "2",
    text: "Compare pilot’s and copilot’s pitot-static data.",
  },
  {
    id: `pitot-static-${sourceFamily}-3-info`,
    kind: "information",
    label: "3",
    text: "Pitot Heat:",
  },
  {
    id: `pitot-static-${sourceFamily}-3a`,
    kind: "action",
    label: "a",
    text: "Pitot Heat Switches — ON",
  },
  {
    id: `pitot-static-${sourceFamily}-3b`,
    kind: "action",
    label: "b",
    text: "L & R PITOT HEAT CBs (ess buses) — IN",
  },
  {
    id: `pitot-static-${sourceFamily}-4-info`,
    kind: "information",
    label: "4",
    text: "Determine malfunctioning system:",
  },
  {
    id: `pitot-static-${sourceFamily}-4a`,
    kind: "action",
    label: "a",
    text: "Cross-check angle-of-attack indicators.",
  },
  {
    id: `pitot-static-${sourceFamily}-4b`,
    kind: "action",
    label: "b",
    text: "Compare indications with estimated performance for existing conditions.",
  },
  {
    id: `pitot-static-${sourceFamily}-4c-info`,
    kind: "information",
    label: "c",
    text: "Compare data from other available sources:",
  },
];

export const learjet35aQrhAbnormalBatch8ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3O Instruments Abnormal Procedures source batch.
 *
 * Covers the complete two-procedure Instruments index family on CL-102B
 * A-25/A-25.1 and A-26. PITOT-STATIC SYSTEM MALFUNCTION has distinct source
 * procedures for aircraft with and without the Rosemount pitot-static system.
 * Visual source review found no boxed memory items.
 */
export const learjet35aQrhAbnormalBatch8 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 8",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3O digitizes the complete Instruments abnormal family from CL-102B A-25/A-25.1 and A-26. PITOT-STATIC SYSTEM MALFUNCTION requires explicit Rosemount pitot-static configuration state so unknown installation remains fail-closed. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "pitot-static-system-malfunction",
      title: "PITOT-STATIC SYSTEM MALFUNCTION",
      procedureClass: "abnormal",
      category: "Instruments",
      effectivity: { kind: "all-aircraft", sourceText: "Configuration-specific" },
      sources: [
        source("A-25", "PITOT-STATIC SYSTEM MALFUNCTION"),
        source("A-25.1", "PITOT-STATIC SYSTEM MALFUNCTION"),
      ],
      stages: [
        mappedStage(
          "pitot-static-without-rosemount-a25",
          "Without Rosemount Pitot-Static System",
          "A-25",
          "PITOT-STATIC SYSTEM MALFUNCTION",
          "Without Rosemount Pitot-Static System",
          withoutRosemountPitotStatic,
          [
            ...commonPitotStaticSteps("without-rosemount"),
            {
              id: "pitot-static-without-rosemount-overspeed-info",
              kind: "information",
              text: "Overspeed warning horn and stick puller are actuated by switches in the copilot’s pitot-static system.",
            },
            {
              id: "pitot-static-without-rosemount-fms-info",
              kind: "information",
              text: "FMS and SAT/TAS system (if installed) provide true airspeed from pilot’s side.",
            },
            {
              id: "pitot-static-without-rosemount-groundspeed-info",
              kind: "information",
              text: "DME systems and ground based radar provide a source for ground speed. By applying the winds to ground speed, aircraft airspeed may be calculated.",
            },
            {
              id: "pitot-static-without-rosemount-autopilot-info",
              kind: "information",
              text: "Pitot-static data to the autopilot/flight director is provided by the copilot’s pitot system and shoulder static ports.",
            },
            {
              id: "pitot-static-without-rosemount-static-intro",
              kind: "information",
              text: "If static pressure malfunction is determined or suspected:",
            },
            {
              id: "pitot-static-without-rosemount-side",
              kind: "condition",
              branches: [
                {
                  id: "pitot-static-without-rosemount-copilot-side",
                  label: "5. Malfunction on copilot’s side",
                  steps: [
                    {
                      id: "pitot-static-without-rosemount-5a",
                      kind: "action",
                      label: "a",
                      text: "Refer to pilot’s instruments.",
                    },
                  ],
                },
                {
                  id: "pitot-static-without-rosemount-pilot-side",
                  label: "Malfunction on pilot’s side",
                  steps: [
                    {
                      id: "pitot-static-without-rosemount-pilot-a",
                      kind: "action",
                      label: "a",
                      text: "Alternate Static Source — OPEN",
                    },
                    {
                      id: "pitot-static-without-rosemount-pilot-b",
                      kind: "action",
                      label: "b",
                      text: "Pilot’s Altimeter — STBY",
                    },
                  ],
                },
              ],
            },
            {
              id: "pitot-static-without-rosemount-afm",
              kind: "information",
              text: "Refer to AFM for Airspeed and Altitude Position Correction Charts.",
            },
          ],
        ),
        mappedStage(
          "pitot-static-with-rosemount-a25-1",
          "With Rosemount Pitot-Static System",
          "A-25.1",
          "PITOT-STATIC SYSTEM MALFUNCTION",
          "With Rosemount Pitot-Static System",
          withRosemountPitotStatic,
          [
            ...commonPitotStaticSteps("with-rosemount"),
            {
              id: "pitot-static-with-rosemount-overspeed-info",
              kind: "information",
              text: "Overspeed warning horn and stick puller will actuate if either pilot’s or copilot’s airspeed indicator needle is above the VMO/MMO “barber pole” pointer.",
            },
            {
              id: "pitot-static-with-rosemount-fms-info",
              kind: "information",
              text: "FMS and SAT/TAS system (if installed) provide true airspeed from pilot’s side.",
            },
            {
              id: "pitot-static-with-rosemount-groundspeed-info",
              kind: "information",
              text: "DME systems and ground based radar provide a source for ground speed. By applying the winds to ground speed, aircraft airspeed may be calculated.",
            },
            {
              id: "pitot-static-with-rosemount-autopilot-info",
              kind: "information",
              text: "Pitot-static data to the autopilot/flight director is provided by the copilot’s pitot-static system.",
            },
            {
              id: "pitot-static-with-rosemount-static-intro",
              kind: "information",
              text: "If static pressure malfunction is determined or suspected:",
            },
            {
              id: "pitot-static-with-rosemount-5",
              kind: "action",
              label: "5",
              text: "Autopilot — DISENGAGE",
            },
            {
              id: "pitot-static-with-rosemount-6",
              kind: "action",
              label: "6",
              text: "STATIC SOURCE Switch — L or R",
            },
            {
              id: "pitot-static-with-rosemount-7",
              kind: "action",
              label: "7",
              text: "Autopilot — AS DESIRED",
            },
          ],
        ),
      ],
    },
    {
      id: "vg-mon-light",
      title: "V.G. MON LIGHT",
      procedureClass: "abnormal",
      category: "Instruments",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-26", "V.G. MON LIGHT")],
      stages: [
        allStage(
          "vg-mon-light-a26",
          "V.G. MON LIGHT",
          "A-26",
          "V.G. MON LIGHT",
          [
            {
              id: "vg-mon-light-info",
              kind: "information",
              text: "One gyro wheel has failed. Remaining wheel is operative & gyro is reliable.",
            },
            {
              id: "vg-mon-light-action",
              kind: "action",
              text: "Replace gyro as soon as practical.",
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
