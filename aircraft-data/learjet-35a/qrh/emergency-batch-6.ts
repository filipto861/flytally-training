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

export const learjet35aQrhThrustReverserConfigurationKeys = {
  aeronca: "thrust-reverser-aeronca",
  tr4000: "thrust-reverser-tr4000",
} as const;

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

const thrustReverserInstalled: AircraftApplicability = {
  anyOf: [aeronca, tr4000],
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

export const learjet35aQrhEmergencyBatch6ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3G thrust-reverser Emergency Procedures batch.
 *
 * CL-102B E-35 and E-35.1 are configuration-specific, not serial-specific.
 * The content stays aircraft-owned while the runtime uses the generic
 * configuration-equipment applicability contract. Production publication
 * remains blocked until the selected Learjet profile explicitly registers and
 * resolves the Aeronca/TR-4000 equipment identifiers.
 */
export const learjet35aQrhEmergencyBatch6 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 6",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3G source digitization from CL-102B E-35 and E-35.1. The procedures are configuration-specific to Aeronca or TR-4000 thrust reversers and remain staged until those exact configuration-equipment identities are registered for the aircraft profile.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "inadvertent-thrust-reverser-deployment-during-takeoff",
      title: "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF",
      procedureClass: "emergency",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText:
          "E-35 with Aeronca Thrust Reversers; E-35.1 below V1 with TR-4000 Thrust Reversers.",
        mappingNote:
          "Aeronca and TR-4000 source procedures are selected only from explicit configured thrust-reverser equipment identity.",
      },
      applicability: thrustReverserInstalled,
      sources: [
        source("E-35", "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF"),
        source("E-35.1", "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF"),
      ],
      stages: [
        mappedStage(
          "aeronca-below-v1",
          "Below V1 Speed — Aeronca",
          "E-35",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF — Below V1",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            { id: "aeronca-below-1", kind: "action", label: "1", text: "Thrust Levers — IDLE", memoryItem: true },
            { id: "aeronca-below-2", kind: "action", label: "2", text: "Wheel Brakes — APPLY", memoryItem: true },
            { id: "aeronca-below-3", kind: "action", label: "3", text: "Spoilers — EXTEND", memoryItem: true },
            { id: "aeronca-below-directional", kind: "action", text: "To improve directional control, position both Reverser Levers to REVERSE IDLE." },
          ],
        ),
        mappedStage(
          "aeronca-above-v1",
          "Above V1 Speed — Aeronca",
          "E-35",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF — Above V1",
          "With Aeronca Thrust Reversers",
          aeronca,
          [
            { id: "aeronca-above-1", kind: "action", label: "1", text: "Rudder & Ailerons — AS REQ’D", memoryItem: true },
            { id: "aeronca-above-2", kind: "action", label: "2", text: "Thrust Lever (affected engine) — IDLE", memoryItem: true },
            { id: "aeronca-above-3", kind: "action", label: "3", text: "Emer Stow Switch — EMER STOW", memoryItem: true },
            { id: "aeronca-above-4", kind: "action", label: "4", text: "Accelerate to VR. Keep nose wheel on runway.", memoryItem: true },
            { id: "aeronca-above-5", kind: "action", label: "5", text: "Rotate at VR, Climb at V2.", memoryItem: true },
            { id: "aeronca-above-6", kind: "action", label: "6", text: "Positive Rate Of Climb Established — GEAR UP", memoryItem: true },
            { id: "aeronca-above-7", kind: "action", label: "7", text: "Clear of Obstacles — ACCELERATE TO V2 + 30, FLAPS UP", memoryItem: true },
            {
              id: "aeronca-above-lights-stay-on",
              kind: "condition",
              branches: [{
                id: "aeronca-above-lights-stay-on-branch",
                label: "If UNLOCK or DEPLOY lights stay on",
                steps: [
                  { id: "aeronca-above-8", kind: "action", label: "8", text: "Thrust Lever (affected engine) — CUTOFF" },
                ],
              }],
            },
            { id: "aeronca-above-9a", kind: "action", label: "9", text: "Fuel Jettison — ON" },
            { id: "aeronca-above-9b", kind: "action", text: "Fuel Jettison — OFF (prior to touchdown)" },
            { id: "aeronca-above-10", kind: "action", label: "10", text: "Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist." },
          ],
        ),
        mappedStage(
          "tr4000-below-v1",
          "Below V1 Speed — TR-4000",
          "E-35.1",
          "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF — Below V1",
          "With TR-4000 Thrust Reversers",
          tr4000,
          [
            { id: "tr4000-below-1", kind: "action", label: "1", text: "Thrust Levers — IDLE", memoryItem: true },
            { id: "tr4000-below-2", kind: "action", label: "2", text: "Wheel Brakes — APPLY", memoryItem: true },
            { id: "tr4000-below-3", kind: "action", label: "3", text: "Spoilers — EXTEND", memoryItem: true },
            { id: "tr4000-below-directional", kind: "action", text: "To improve directional control, position both Reverser Levers to REVERSE IDLE." },
          ],
        ),
      ],
    },
    {
      id: "indication-of-thrust-reverser-deployment-during-takeoff",
      title: "INDICATION OF THRUST REVERSER DEPLOYMENT DURING TAKEOFF",
      procedureClass: "emergency",
      category: "Thrust Reversers",
      effectivity: {
        kind: "mapped",
        sourceText: "With TR-4000 Thrust Reversers",
        mappingNote:
          "This indexed procedure title is present only in the TR-4000 E-35.1 source variant.",
      },
      applicability: tr4000,
      sources: [
        source("E-35.1", "INDICATION OF THRUST REVERSER DEPLOYMENT DURING TAKEOFF"),
      ],
      stages: [
        mappedStage(
          "tr4000-above-v1",
          "Above V1 Speed — TR-4000",
          "E-35.1",
          "INDICATION OF THRUST REVERSER DEPLOYMENT DURING TAKEOFF — Above V1",
          "With TR-4000 Thrust Reversers",
          tr4000,
          [
            { id: "tr4000-above-1", kind: "action", label: "1", text: "Rudder & Ailerons — AS REQ’D", memoryItem: true },
            { id: "tr4000-above-2", kind: "action", label: "2", text: "Thrust Lever (affected engine) — IDLE", memoryItem: true },
            { id: "tr4000-above-3", kind: "action", label: "3", text: "Thrust Reverser Control Switches — OFF", memoryItem: true },
            { id: "tr4000-above-4", kind: "action", label: "4", text: "Accelerate to VR. Keep nose wheel on runway.", memoryItem: true },
            { id: "tr4000-above-5", kind: "action", label: "5", text: "Rotate at VR, Climb at V2.", memoryItem: true },
            { id: "tr4000-above-6", kind: "action", label: "6", text: "Positive Rate Of Climb Established — GEAR UP", memoryItem: true },
            { id: "tr4000-above-7", kind: "action", label: "7", text: "Clear of Obstacles — ACCELERATE TO V2 + 30, FLAPS UP", memoryItem: true },
            {
              id: "tr4000-above-deploy-stays-on",
              kind: "condition",
              branches: [{
                id: "tr4000-above-deploy-stays-on-branch",
                label: "8. If DEPLOY light stays on",
                memoryItem: true,
                steps: [
                  { id: "tr4000-above-8", kind: "action", text: "Thrust Lever (affected engine) — CUTOFF", memoryItem: true },
                ],
              }],
            },
            { id: "tr4000-above-9a", kind: "action", label: "9", text: "Fuel Jettison — ON" },
            { id: "tr4000-above-9b", kind: "action", text: "Fuel Jettison — OFF (prior to touchdown)" },
            { id: "tr4000-above-10", kind: "action", label: "10", text: "If engine was shut down, refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, this section." },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
