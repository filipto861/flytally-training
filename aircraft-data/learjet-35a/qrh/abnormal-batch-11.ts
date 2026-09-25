import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";
import { learjet35aQrhThrustReverserConfigurationKeys } from "./emergency-batch-6.ts";

const source = (pageLabel: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section: "TURBULENT AIR PENETRATION",
  pageLabel,
});

const withoutThrustReversers: AircraftApplicability = {
  configurationEquipmentNoneOf: [
    learjet35aQrhThrustReverserConfigurationKeys.aeronca,
    learjet35aQrhThrustReverserConfigurationKeys.tr4000,
  ],
};

const aeronca: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhThrustReverserConfigurationKeys.aeronca,
  ],
  configurationEquipmentNoneOf: [
    learjet35aQrhThrustReverserConfigurationKeys.tr4000,
  ],
};

const tr4000: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhThrustReverserConfigurationKeys.tr4000,
  ],
  configurationEquipmentNoneOf: [
    learjet35aQrhThrustReverserConfigurationKeys.aeronca,
  ],
};

const mappedStage = (
  id: string,
  label: string,
  pageLabel: string,
  sourceText: string,
  applicability: AircraftApplicability,
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "mapped", sourceText },
  applicability,
  sources: [source(pageLabel)],
  steps: [
    {
      id: `${id}-1`,
      kind: "action",
      label: "1",
      text: "Airspeed — 250 KIAS or .73 MI whichever is less.",
    },
    {
      id: `${id}-2`,
      kind: "action",
      label: "2",
      text: "Thrust — Set & Ignition — ON",
    },
    {
      id: `${id}-3`,
      kind: "action",
      label: "3",
      text: "Attitude — Maintain wings level and desired pitch. Use attitude indicator as primary instrument.",
    },
    {
      id: `${id}-4`,
      kind: "action",
      label: "4",
      text: "Stabilizer — Maintain control with elevators. Do not change stabilizer trim after set for penetration.",
    },
    {
      id: `${id}-5`,
      kind: "action",
      label: "5",
      text: "Altitude — Allow altitude to vary.",
    },
    {
      id: `${id}-6`,
      kind: "information",
      label: "6",
      text: "Autopilot and Yaw Damper:",
    },
    {
      id: `${id}-6-yaw-damper`,
      kind: "action",
      text: "Yaw Damper — ENGAGED",
    },
    {
      id: `${id}-6-autopilot`,
      kind: "action",
      text: "Autopilot Attitude Hold and Soft Modes — ENGAGED",
    },
  ],
});

export const learjet35aQrhAbnormalBatch11ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3R Turbulence Abnormal source batch.
 *
 * CL-102B publishes the same TURBULENT AIR PENETRATION procedure on three
 * separate effectivity pages: A-33 without thrust reversers, A-33.1 with
 * Aeronca thrust reversers and A-33.2 with TR-4000 thrust reversers.
 *
 * The identical source text is represented once structurally per source stage
 * so provenance/effectivity remain exact while the generic applicability
 * runtime selects only the configured source family. Unknown or contradictory
 * thrust-reverser identity therefore fails closed. Visual source review found
 * no boxed memory items on any of the three pages.
 */
export const learjet35aQrhAbnormalBatch11 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 11",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3R digitizes TURBULENT AIR PENETRATION from CL-102B A-33, A-33.1 and A-33.2. The three pages carry identical procedure text but distinct thrust-reverser effectivity. Selection is fail-closed through explicit generic configuration-equipment applicability.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "turbulent-air-penetration",
      title: "TURBULENT AIR PENETRATION",
      procedureClass: "abnormal",
      category: "Turbulence",
      effectivity: {
        kind: "mapped",
        sourceText:
          "A-33 Without Thrust Reversers; A-33.1 With Aeronca Thrust Reversers; A-33.2 With TR-4000 Thrust Reversers.",
        mappingNote:
          "The source page is selected only from explicit configured thrust-reverser identity; unknown or contradictory identity fails closed.",
      },
      applicability: {
        anyOf: [withoutThrustReversers, aeronca, tr4000],
      },
      sources: [source("A-33"), source("A-33.1"), source("A-33.2")],
      stages: [
        mappedStage(
          "turbulence-no-reversers",
          "Without Thrust Reversers",
          "A-33",
          "Without Thrust Reversers",
          withoutThrustReversers,
        ),
        mappedStage(
          "turbulence-aeronca",
          "With Aeronca Thrust Reversers",
          "A-33.1",
          "With Aeronca Thrust Reversers",
          aeronca,
        ),
        mappedStage(
          "turbulence-tr4000",
          "With TR-4000 Thrust Reversers",
          "A-33.2",
          "With TR-4000 Thrust Reversers",
          tr4000,
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
