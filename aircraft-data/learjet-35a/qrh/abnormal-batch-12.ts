import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";
import { learjet35aQrhThrustReverserConfigurationKeys } from "./emergency-batch-6.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section,
  pageLabel,
});

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

export const learjet35aQrhAbnormalBatch12ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3S Thrust Reversers Abnormal source batch.
 *
 * The CL-102B abnormal index contains four Aeronca textual procedures and two
 * TR-4000 textual procedures plus the graphical TR-4000 RESTOW ENVELOPE.
 * QRH.3T represents A-35.2 generically as source-digitized visual reference
 * geometry without converting its curved boundaries into a computational lookup.
 *
 * Visual review of A-34.1, A-34.2 and A-35.1 found no boxed memory items.
 * Annunciator depictions are source indications, not memory boxes.
 */
export const learjet35aQrhAbnormalBatch12 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 12",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3S/3T digitizes the complete Thrust Reversers abnormal family from CL-102B A-34.1/A-34.2/A-35.1/A-35.2. The A-35.2 Restow Envelope is preserved as a source-digitized visual reference and is not a computational lookup surface.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  figures: [
    {
      id: "thrust-reverser-restow-envelope",
      kind: "operating-envelope",
      title: "THRUST REVERSER RESTOW ENVELOPE",
      geometryPolicy: "source-digitized-visual-reference",
      xAxis: {
        key: "indicated-airspeed",
        label: "INDICATED AIRSPEED",
        unit: "KNOTS",
        min: 100,
        max: 210,
        ticks: [100, 125, 150, 175, 200],
      },
      yAxis: {
        key: "altitude",
        label: "ALTITUDE",
        unit: "1000 FEET",
        min: 0,
        max: 25,
        ticks: [0, 5, 10, 15, 20],
      },
      regions: [
        {
          id: "engine-shutdown-or-flight-idle",
          label: "ENGINE SHUTDOWN\nOR FLIGHT IDLE\nRESTOW ENVELOPE",
          fill: "shaded",
          points: [
            { x: 100, y: 0 },
            { x: 180, y: 0 },
            { x: 180, y: 9 },
            { x: 175, y: 10.2 },
            { x: 170, y: 11 },
            { x: 165, y: 11.6 },
            { x: 160, y: 12 },
            { x: 150, y: 12.2 },
            { x: 125, y: 12.2 },
            { x: 125, y: 10 },
            { x: 100, y: 10 },
          ],
          labelAt: { x: 143, y: 7 },
        },
        {
          id: "engine-shutdown",
          label: "ENGINE SHUTDOWN\nRESTOW ENVELOPE",
          fill: "hatched",
          points: [
            { x: 125, y: 12.2 },
            { x: 125, y: 21 },
            { x: 130, y: 20 },
            { x: 140, y: 18 },
            { x: 150, y: 16 },
            { x: 180, y: 15 },
            { x: 180, y: 9 },
            { x: 175, y: 10.2 },
            { x: 170, y: 11 },
            { x: 165, y: 11.6 },
            { x: 160, y: 12 },
            { x: 150, y: 12.2 },
          ],
          labelAt: { x: 151, y: 14 },
        },
      ],
      sources: [source("A-35.2", "THRUST REVERSER RESTOW ENVELOPE")],
    },
  ],
  scenarios: [
    {
      id: "aeronca-inadvertent-thrust-reverser-deployment-during-flight",
      title: "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With Aeronca Thrust Reversers",
        mappingNote:
          "A-34.1 is selected only from explicit Aeronca thrust-reverser configuration identity.",
      },
      applicability: aeronca,
      sources: [
        source(
          "A-34.1",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
        ),
      ],
      stages: [
        mappedStage(
          "aeronca-inadvertent-flight-a34-1",
          "With Aeronca Thrust Reversers",
          "A-34.1",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            {
              id: "aeronca-inadvertent-1",
              kind: "action",
              label: "1",
              text: "Rudder & Ailerons — AS REQ’D",
            },
            {
              id: "aeronca-inadvertent-2",
              kind: "action",
              label: "2",
              text: "Thrust Lever (affected engine) — IDLE",
            },
            {
              id: "aeronca-inadvertent-3",
              kind: "action",
              label: "3",
              text: "Maintain Safe Airspeed — 200 MAX",
            },
            {
              id: "aeronca-inadvertent-4",
              kind: "action",
              label: "4",
              text: "Emer Stow Switch — EMER STOW",
            },
            {
              id: "aeronca-inadvertent-5",
              kind: "action",
              label: "5",
              text: "Bleed Air (affected engine) — OFF",
            },
            {
              id: "aeronca-inadvertent-lights-stay-on",
              kind: "condition",
              branches: [
                {
                  id: "aeronca-inadvertent-lights-stay-on-branch",
                  label: "If UNLOCK or DEPLOY Lights stay on",
                  steps: [
                    {
                      id: "aeronca-inadvertent-6",
                      kind: "action",
                      label: "6",
                      text: "Shut down affected engine. Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 4, this section.",
                    },
                    {
                      id: "aeronca-inadvertent-7",
                      kind: "action",
                      label: "7",
                      text: "Fly single-engine approach & landing. Refer to SINGLE-ENGINE LANDING procedure, Tab 12, this section.",
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
      id: "aeronca-unlock-light-in-flight",
      title: "UNLOCK LIGHT IN FLIGHT (THRUST REVERSER NOT DEPLOYED)",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With Aeronca Thrust Reversers",
        mappingNote:
          "A-34.1 is selected only from explicit Aeronca thrust-reverser configuration identity.",
      },
      applicability: aeronca,
      sources: [
        source(
          "A-34.1",
          "UNLOCK LIGHT IN FLIGHT (THRUST REVERSER NOT DEPLOYED)",
        ),
      ],
      stages: [
        mappedStage(
          "aeronca-unlock-flight-a34-1",
          "With Aeronca Thrust Reversers",
          "A-34.1",
          "UNLOCK LIGHT IN FLIGHT (THRUST REVERSER NOT DEPLOYED)",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            {
              id: "aeronca-unlock-flight-1",
              kind: "action",
              label: "1",
              text: "Affected Thrust Lever — IDLE",
            },
            {
              id: "aeronca-unlock-flight-2",
              kind: "action",
              label: "2",
              text: "Airspeed — BELOW 200 KIAS",
            },
            {
              id: "aeronca-unlock-flight-3",
              kind: "action",
              label: "3",
              text: "Emer Stow Switch — EMER STOW",
            },
            {
              id: "aeronca-unlock-flight-4",
              kind: "action",
              label: "4",
              text: "Bleed Air (affected engine) — OFF",
            },
            {
              id: "aeronca-unlock-flight-result",
              kind: "condition",
              branches: [
                {
                  id: "aeronca-unlock-flight-extinguishes",
                  label: "If UNLOCK Light Extinguishes",
                  steps: [
                    {
                      id: "aeronca-unlock-flight-ext-a",
                      kind: "action",
                      label: "a",
                      text: "Emer Stow Switch — NORM",
                    },
                    {
                      id: "aeronca-unlock-flight-ext-b",
                      kind: "action",
                      label: "b",
                      text: "Bleed Air (affected engine) — ON",
                    },
                    {
                      id: "aeronca-unlock-flight-ext-c",
                      kind: "action",
                      label: "c",
                      text: "Affected Thrust Lever — AS REQ’D",
                    },
                  ],
                },
                {
                  id: "aeronca-unlock-flight-does-not-extinguish",
                  label: "If UNLOCK Light does not Extinguish",
                  steps: [
                    {
                      id: "aeronca-unlock-flight-noext-a",
                      kind: "action",
                      label: "a",
                      text: "Emer Stow Switch — EMER STOW",
                    },
                    {
                      id: "aeronca-unlock-flight-noext-b",
                      kind: "action",
                      label: "b",
                      text: "Bleed Air (affected engine) — ON",
                    },
                    {
                      id: "aeronca-unlock-flight-noext-c",
                      kind: "action",
                      label: "c",
                      text: "Affected Thrust Lever — AS REQ’D",
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
      id: "aeronca-unlock-light-after-normal-deploy",
      title: "UNLOCK LIGHT AFTER NORMAL DEPLOY",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With Aeronca Thrust Reversers",
        mappingNote:
          "A-35.1 is selected only from explicit Aeronca thrust-reverser configuration identity.",
      },
      applicability: aeronca,
      sources: [source("A-35.1", "UNLOCK LIGHT AFTER NORMAL DEPLOY")],
      stages: [
        mappedStage(
          "aeronca-unlock-after-deploy-a35-1",
          "With Aeronca Thrust Reversers",
          "A-35.1",
          "UNLOCK LIGHT AFTER NORMAL DEPLOY",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            {
              id: "aeronca-unlock-after-deploy-info",
              kind: "information",
              text: "Reverse thrust operation is permitted. Repair or pin affected thrust reverser before further flight.",
            },
          ],
        ),
      ],
    },
    {
      id: "aeronca-failure-thrust-reverser-to-stow-after-landing",
      title: "FAILURE OF THRUST REVERSER TO STOW AFTER LANDING",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With Aeronca Thrust Reversers",
        mappingNote:
          "A-35.1 is selected only from explicit Aeronca thrust-reverser configuration identity.",
      },
      applicability: aeronca,
      sources: [
        source("A-35.1", "FAILURE OF THRUST REVERSER TO STOW AFTER LANDING"),
      ],
      stages: [
        mappedStage(
          "aeronca-failure-stow-a35-1",
          "With Aeronca Thrust Reversers",
          "A-35.1",
          "FAILURE OF THRUST REVERSER TO STOW AFTER LANDING",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            {
              id: "aeronca-failure-stow-state",
              kind: "condition",
              branches: [
                {
                  id: "aeronca-failure-stow-deploy-bleed",
                  label: "If DEPLOY & BLEED VALVE lights remain on",
                  steps: [
                    {
                      id: "aeronca-failure-stow-deploy-bleed-1",
                      kind: "action",
                      label: "1",
                      text: "Emer Stow Switch — EMER STOW",
                    },
                    {
                      id: "aeronca-failure-stow-deploy-bleed-2",
                      kind: "action",
                      label: "2",
                      text: "If reverser does not stow, shut down affected engine.",
                    },
                  ],
                },
                {
                  id: "aeronca-failure-stow-deploy",
                  label: "If DEPLOY light remains on",
                  steps: [
                    {
                      id: "aeronca-failure-stow-deploy-1",
                      kind: "action",
                      label: "1",
                      text: "Thrust Lever (affected engine) — IDLE",
                    },
                    {
                      id: "aeronca-failure-stow-deploy-2",
                      kind: "action",
                      label: "2",
                      text: "Emer Stow Switch — EMER STOW",
                    },
                  ],
                },
                {
                  id: "aeronca-failure-stow-unlock",
                  label: "If UNLOCK light remains on",
                  steps: [
                    {
                      id: "aeronca-failure-stow-unlock-1",
                      kind: "action",
                      label: "1",
                      text: "Shut down affected engine. Do not recycle thrust reverser.",
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
      id: "tr4000-annunciated-thrust-reverser-malfunction",
      title: "ANNUNCIATED THRUST REVERSER MALFUNCTION (REVERSER NOT DEPLOYED)",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With TR-4000 Thrust Reversers",
        mappingNote:
          "A-34.2 is selected only from explicit TR-4000 thrust-reverser configuration identity.",
      },
      applicability: tr4000,
      sources: [
        source(
          "A-34.2",
          "ANNUNCIATED THRUST REVERSER MALFUNCTION (REVERSER NOT DEPLOYED)",
        ),
      ],
      stages: [
        mappedStage(
          "tr4000-annunciated-malfunction-a34-2",
          "Affected Engine",
          "A-34.2",
          "ANNUNCIATED THRUST REVERSER MALFUNCTION (REVERSER NOT DEPLOYED)",
          "With TR-4000 Thrust Reversers",
          tr4000,
          [
            {
              id: "tr4000-annunciated-1",
              kind: "action",
              label: "1",
              text: "Thrust Lever — IDLE",
            },
            {
              id: "tr4000-annunciated-2",
              kind: "action",
              label: "2",
              text: "Reverse Lever — STOW",
            },
            {
              id: "tr4000-annunciated-3",
              kind: "action",
              label: "3",
              text: "Reverser Control Switch — OFF",
            },
            {
              id: "tr4000-annunciated-4",
              kind: "action",
              label: "4",
              text: "T/R CONTROL & T/R POWER CBs (main bus) — PULL",
            },
            {
              id: "tr4000-annunciated-5",
              kind: "action",
              label: "5",
              text: "Thrust Lever — AS REQ’D",
            },
            {
              id: "tr4000-annunciated-6",
              kind: "action",
              label: "6",
              text: "If desired, continue flight using Normal Procedures.",
            },
            {
              id: "tr4000-annunciated-7",
              kind: "action",
              label: "7",
              text: "Do not use affected reverser on landing.",
            },
          ],
        ),
      ],
    },
    {
      id: "tr4000-inadvertent-thrust-reverser-deployment-during-flight",
      title: "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
      procedureClass: "abnormal",
      category: "Thrust Reversers",
      figureIds: ["thrust-reverser-restow-envelope"],
      effectivity: {
        kind: "mapped",
        sourceText: "With TR-4000 Thrust Reversers",
        mappingNote:
          "A-34.2 is selected only from explicit TR-4000 thrust-reverser configuration identity. QRH.3T attaches the reviewed A-35.2 Restow Envelope as a source-digitized visual reference.",
      },
      applicability: tr4000,
      sources: [
        source(
          "A-34.2",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
        ),
      ],
      stages: [
        mappedStage(
          "tr4000-inadvertent-flight-a34-2",
          "Affected Engine",
          "A-34.2",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
          "With TR-4000 Thrust Reversers",
          tr4000,
          [
            {
              id: "tr4000-inadvertent-1",
              kind: "action",
              label: "1",
              text: "Thrust Lever — IDLE",
            },
            {
              id: "tr4000-inadvertent-2",
              kind: "action",
              label: "2",
              text: "Reverser Lever — STOW",
            },
            {
              id: "tr4000-inadvertent-3",
              kind: "action",
              label: "3",
              text: "Reverser Control Switch — OFF",
            },
            {
              id: "tr4000-inadvertent-4",
              kind: "action",
              label: "4",
              text: "T/R POWER CB (main bus) — PULL",
            },
            {
              id: "tr4000-inadvertent-5",
              kind: "action",
              label: "5",
              text: "Assure Restow Envelope.",
            },
            {
              id: "tr4000-inadvertent-restow-result",
              kind: "condition",
              branches: [
                {
                  id: "tr4000-inadvertent-deploy-continues",
                  label:
                    "6. If DEPLOY light continues to flash or reverser remains deployed",
                  steps: [
                    {
                      id: "tr4000-inadvertent-6a",
                      kind: "action",
                      label: "a",
                      text: "Shut down engine.",
                    },
                    {
                      id: "tr4000-inadvertent-6b",
                      kind: "action",
                      label: "b",
                      text: "T/R CONTROL CB (main bus) — PULL",
                    },
                    {
                      id: "tr4000-inadvertent-6c",
                      kind: "action",
                      label: "c",
                      text: "Enroute Airspeed — Above 160 KIAS",
                    },
                    {
                      id: "tr4000-inadvertent-6d",
                      kind: "action",
                      label: "d",
                      text: "Land as soon as possible. Refer to ONE THRUST REVERSER DEPLOYED LANDING procedure, Tab 15, this section.",
                    },
                  ],
                },
                {
                  id: "tr4000-inadvertent-restow-occurred",
                  label:
                    "If DEPLOY light stops flashing, ARM light goes out, and restow has occurred",
                  steps: [
                    {
                      id: "tr4000-inadvertent-restow-a",
                      kind: "action",
                      label: "a",
                      text: "T/R CONTROL CB (main bus) — PULL",
                    },
                    {
                      id: "tr4000-inadvertent-restow-b",
                      kind: "action",
                      label: "b",
                      text: "Continue flight using idle thrust.",
                    },
                    {
                      id: "tr4000-inadvertent-restow-c",
                      kind: "action",
                      label: "c",
                      text: "Refer to SINGLE-ENGINE LANDING procedure, Tab 12, this section.",
                    },
                    {
                      id: "tr4000-inadvertent-restow-d",
                      kind: "action",
                      label: "d",
                      text: "Do not use affected reverser on landing.",
                    },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
