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

export const learjet35aQrhFlightControlsConfigurationKeys = {
  machTrim: "mach-trim",
  pitchTrimLight: "pitch-trim-light",
} as const;

const machTrimInstalled: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhFlightControlsConfigurationKeys.machTrim,
  ],
};

const pitchTrimLightInstalled: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhFlightControlsConfigurationKeys.pitchTrimLight,
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
  applicability: AircraftApplicability,
  steps: AircraftQrhStage["steps"],
): AircraftQrhStage => ({
  id,
  label,
  effectivity: { kind: "mapped", sourceText: "ALL — IF APPLICABLE" },
  applicability,
  sources: [source(pageLabel, section)],
  steps,
});

export const learjet35aQrhAbnormalBatch5ReleaseStatus =
  "staged-source-review" as const;

export const learjet35aQrhAbnormalBatch5 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 5",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3L digitizes the complete Flight Controls abnormal family from CL-102B A-17 through A-19. MACH TRIM MALFUNCTION and PITCH TRIM LIGHT IN FLIGHT preserve the source IF APPLICABLE qualifier through explicit configured-equipment applicability. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "aug-ail-light",
      title: "AUG AIL LIGHT",
      procedureClass: "abnormal",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-17", "AUG AIL LIGHT")],
      stages: [
        allStage("aug-ail-a17", "AUG AIL LIGHT", "A-17", "AUG AIL LIGHT", [
          { id: "aug-ail-1", kind: "action", label: "1", text: "Spoiler Switch — RET" },
          { id: "aug-ail-2", kind: "action", label: "2", text: "Spoileron Reset Switch — RESET & RELEASE" },
          {
            id: "aug-ail-again",
            kind: "condition",
            branches: [{
              id: "aug-ail-again-branch",
              label: "3. If AUG AIL Light illuminates again",
              steps: [
                { id: "aug-ail-3a", kind: "action", label: "a", text: "SPOILERON CB (copilot’s AC bus) — PULL" },
                { id: "aug-ail-3b", kind: "information", label: "b", text: "Spoilers will be inoperative in flight." },
                { id: "aug-ail-3c", kind: "information", label: "c", text: "Spoilerons will be inoperative in flight." },
                { id: "aug-ail-3d", kind: "information", label: "d", text: "Spoilers will function normally during ground operations." },
              ],
            }],
          },
        ]),
      ],
    },
    {
      id: "mach-trim-malfunction",
      title: "MACH TRIM MALFUNCTION",
      procedureClass: "abnormal",
      category: "Flight Controls",
      effectivity: {
        kind: "mapped",
        sourceText: "ALL — IF APPLICABLE",
        mappingNote:
          "Source applicability is equipment-qualified; explicit configured mach-trim installation is required.",
      },
      applicability: machTrimInstalled,
      sources: [source("A-17", "MACH TRIM MALFUNCTION (IF APPLICABLE)")],
      stages: [
        mappedStage(
          "mach-trim-a17",
          "MACH TRIM MALFUNCTION (IF APPLICABLE)",
          "A-17",
          "MACH TRIM MALFUNCTION (IF APPLICABLE)",
          machTrimInstalled,
          [
            { id: "mach-trim-1", kind: "action", label: "1", text: "Airspeed — BELOW 0.74MI" },
            { id: "mach-trim-2", kind: "information", label: "2", text: "Check Primary Pitch Trim available:" },
            { id: "mach-trim-2a", kind: "action", label: "a", text: "Pitch Trim — PRI" },
            { id: "mach-trim-2b", kind: "action", label: "b", text: "Primary PITCH CB (pilot’s ess bus) — IN" },
            { id: "mach-trim-3", kind: "action", label: "3", text: "MACH TRIM CB (pilot’s AC bus) — CHECK" },
            {
              id: "mach-trim-cb-state",
              kind: "condition",
              branches: [
                {
                  id: "mach-trim-open",
                  label: "If MACH TRIM CB Open",
                  steps: [
                    { id: "mach-trim-open-a", kind: "action", label: "a", text: "MACH TRIM CB — RESET" },
                    { id: "mach-trim-open-b", kind: "action", label: "b", text: "Test Selector Switch — MACH TRIM" },
                    { id: "mach-trim-open-c", kind: "action", label: "c", text: "Test Button — DEPRESS & RELEASE" },
                    {
                      id: "mach-trim-opens-again",
                      kind: "condition",
                      branches: [{
                        id: "mach-trim-opens-again-branch",
                        label: "d. If MACH TRIM CB opens again",
                        steps: [
                          { id: "mach-trim-open-d", kind: "action", text: "MACH TRIM CB — LEAVE OPEN" },
                        ],
                      }],
                    },
                  ],
                },
                {
                  id: "mach-trim-closed",
                  label: "If MACH TRIM CB Closed",
                  steps: [
                    { id: "mach-trim-closed-a", kind: "information", label: "a", text: "Reset Mach Trim Monitor if desired:" },
                    { id: "mach-trim-closed-a1", kind: "action", label: "(1)", text: "Test Selector Switch — MACH TRIM" },
                    { id: "mach-trim-closed-a2", kind: "action", label: "(2)", text: "Test Button — DEPRESS & RELEASE" },
                    {
                      id: "mach-trim-light-remains",
                      kind: "condition",
                      branches: [{
                        id: "mach-trim-light-remains-branch",
                        label: "b. If MACH TRIM Light remains on",
                        steps: [
                          { id: "mach-trim-closed-b", kind: "action", text: "MACH TRIM CB — PULL" },
                        ],
                      }],
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
      id: "pitch-trim-light-in-flight",
      title: "PITCH TRIM LIGHT IN FLIGHT",
      procedureClass: "abnormal",
      category: "Flight Controls",
      effectivity: {
        kind: "mapped",
        sourceText: "ALL — IF APPLICABLE",
        mappingNote:
          "Source applicability is equipment-qualified; explicit configured pitch-trim-light installation is required.",
      },
      applicability: pitchTrimLightInstalled,
      sources: [source("A-18", "PITCH TRIM LIGHT IN FLIGHT (IF APPLICABLE)")],
      stages: [
        mappedStage(
          "pitch-trim-light-a18",
          "PITCH TRIM LIGHT IN FLIGHT (IF APPLICABLE)",
          "A-18",
          "PITCH TRIM LIGHT IN FLIGHT (IF APPLICABLE)",
          pitchTrimLightInstalled,
          [
            { id: "pitch-trim-light-1", kind: "action", label: "1", text: "Pitch Trim — SEC" },
            { id: "pitch-trim-light-2", kind: "action", label: "2", text: "NOSE DN-OFF-NOSE UP Switch — AS REQ’D" },
          ],
        ),
      ],
    },
    {
      id: "stall-warning-system-failure",
      title: "STALL WARNING SYSTEM FAILURE",
      procedureClass: "abnormal",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-18", "STALL WARNING SYSTEM FAILURE")],
      stages: [
        allStage(
          "stall-warning-a18",
          "STALL WARNING SYSTEM FAILURE",
          "A-18",
          "STALL WARNING SYSTEM FAILURE",
          [
            {
              id: "stall-warning-failure-mode",
              kind: "condition",
              branches: [
                {
                  id: "stall-warning-both-fail",
                  label: "If both L & R systems fail",
                  steps: [
                    { id: "stall-warning-both-1", kind: "action", label: "1", text: "Airspeed — 30 KNOTS ABOVE STALL" },
                    { id: "stall-warning-both-vref", kind: "information", text: "VREF may be maintained on final" },
                    { id: "stall-warning-both-2", kind: "action", label: "2", text: "Bank angles — 30° MAX" },
                    { id: "stall-warning-both-3", kind: "information", label: "3", text: "If L STALL WARNING Switch OFF, stick puller is inoperative, MMO = 0.74 MI" },
                  ],
                },
                {
                  id: "stall-warning-one-fails",
                  label: "If only one system fails",
                  steps: [
                    {
                      id: "stall-warning-side",
                      kind: "condition",
                      branches: [
                        {
                          id: "stall-warning-left",
                          label: "If L Stall fails",
                          steps: [
                            { id: "stall-warning-left-1", kind: "action", label: "1", text: "Yaw Damper — SEC" },
                            { id: "stall-warning-left-2", kind: "information", label: "2", text: "If L STALL WARNING Switch OFF, stick puller is inoperative, MMO = 0.74 MI" },
                          ],
                        },
                        {
                          id: "stall-warning-right",
                          label: "If R Stall fails",
                          steps: [
                            { id: "stall-warning-right-1", kind: "action", label: "1", text: "Yaw Damper — PRI" },
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
      id: "yaw-damper-failure",
      title: "YAW DAMPER FAILURE",
      procedureClass: "abnormal",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-19", "YAW DAMPER FAILURE")],
      stages: [
        allStage(
          "yaw-damper-single-a19",
          "SINGLE YAW DAMPER FAILURE",
          "A-19",
          "YAW DAMPER FAILURE — SINGLE YAW DAMPER FAILURE",
          [
            { id: "yaw-damper-single-1", kind: "action", label: "1", text: "Yaw Damper — SELECT REMAINING SYSTEM" },
            { id: "yaw-damper-single-2", kind: "action", label: "2", text: "Avoid moderate/severe turbulence." },
            { id: "yaw-damper-single-3", kind: "action", label: "3", text: "Do not initiate further flight until corrected." },
          ],
        ),
        allStage(
          "yaw-damper-dual-a19",
          "DUAL YAW DAMPER FAILURE",
          "A-19",
          "YAW DAMPER FAILURE — DUAL YAW DAMPER FAILURE",
          [
            { id: "yaw-damper-dual-speed", kind: "information", text: "Maintaining higher airspeed (250 KIAS or higher where applicable) will improve Dutch roll stability." },
            { id: "yaw-damper-dual-tip-fuel", kind: "information", text: "Landing with minimum tip fuel will improve Dutch roll stability and lateral control. With both yaw dampers inoperative, plan flight to land with both tip tanks empty." },
            { id: "yaw-damper-dual-1", kind: "action", label: "1", text: "Avoid moderate/severe turbulence." },
            { id: "yaw-damper-dual-2", kind: "action", label: "2", text: "Land as soon as practical." },
            { id: "yaw-damper-dual-3", kind: "action", label: "3", text: "Do not initiate further flight until corrected." },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
