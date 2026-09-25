import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Abnormal Procedures",
  section,
  pageLabel,
});

const sourceAll = (
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

export const learjet35aQrhAbnormalBatch3ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3J Engine Abnormal Procedures source batch.
 *
 * Covers the complete six-procedure Engine index family on CL-102B A-11
 * through A-13. Visual source review found no boxed memory items. The vertical
 * bars visible on A-11 are Change 1 revision bars and must not be interpreted
 * as memory-item boxes.
 */
export const learjet35aQrhAbnormalBatch3 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 3",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3J source digitization of the complete Engine abnormal family from CL-102B A-11 through A-13. A-11 is marked Change 1 in the reviewed Change 2 manual; its vertical change bars are revision marks, not memory-item boxes.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "abnormal-engine-operation",
      title: "ABNORMAL ENGINE OPERATION",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-11", "ABNORMAL ENGINE OPERATION")],
      stages: [
        sourceAll(
          "abnormal-engine-operation-a11",
          "FAN SPEED (N1) OR TURBINE SPEED (N2) DECREASING OR INAPPROPRIATE FOR THRUST LEVER POSITION",
          "A-11",
          "ABNORMAL ENGINE OPERATION",
          [
            { id: "abnormal-engine-operation-1", kind: "action", label: "1", text: "Thrust Lever — IDLE" },
            { id: "abnormal-engine-operation-2", kind: "action", label: "2", text: "Fuel Computer — OFF" },
            {
              id: "abnormal-engine-operation-normal",
              kind: "condition",
              branches: [{
                id: "abnormal-engine-operation-normal-branch",
                label: "3. If engine characteristics appear normal",
                steps: [
                  {
                    id: "abnormal-engine-operation-3",
                    kind: "action",
                    text: "Continue flight with fuel computer in manual mode. Follow the appropriate sections of the FUEL CMPTR LIGHT procedure, this page.",
                  },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "fuel-comptr-light",
      title: "FUEL CMPTR LIGHT",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-11", "FUEL CMPTR LIGHT")],
      stages: [
        sourceAll(
          "fuel-comptr-light-a11",
          "Affected Engine",
          "A-11",
          "FUEL CMPTR LIGHT",
          [
            { id: "fuel-comptr-light-1", kind: "action", label: "1", text: "FUEL COMPTR CB (ess bus) — CHECK & RESET" },
            { id: "fuel-comptr-light-2", kind: "action", label: "2", text: "Fuel Computer — OFF then ON (50% to 60% N1)" },
            {
              id: "fuel-comptr-light-offline",
              kind: "condition",
              branches: [{
                id: "fuel-comptr-light-offline-branch",
                label: "If fuel computer does not come back on line",
                steps: [
                  { id: "fuel-comptr-light-off", kind: "action", text: "Fuel Computer — OFF" },
                  { id: "fuel-comptr-light-3", kind: "action", label: "3", text: "Crossflow Valve — CLOSE" },
                  { id: "fuel-comptr-light-4", kind: "information", label: "4", text: "FUS TANK Switches as follows:" },
                  { id: "fuel-comptr-light-4a", kind: "action", label: "a", text: "Transfer-Fill — OFF" },
                  { id: "fuel-comptr-light-4b", kind: "action", label: "b", text: "Fus Valve (if installed) — CLOSE" },
                  { id: "fuel-comptr-light-5", kind: "action", label: "5", text: "Standby Pump — ON" },
                  { id: "fuel-comptr-light-6", kind: "action", label: "6", text: "Jet Pump — OFF" },
                  {
                    id: "fuel-comptr-light-crossflow-transfer",
                    kind: "condition",
                    branches: [{
                      id: "fuel-comptr-light-crossflow-transfer-branch",
                      label: "To crossflow or transfer fuel",
                      steps: [
                        { id: "fuel-comptr-light-7", kind: "action", label: "7", text: "Jet Pump — ON (Steady N1 ≥ 80%)" },
                        { id: "fuel-comptr-light-8", kind: "action", label: "8", text: "Standby Pump — OFF" },
                        { id: "fuel-comptr-light-9", kind: "action", label: "9", text: "Crossflow or transfer fuel as required." },
                        { id: "fuel-comptr-light-10", kind: "action", label: "10", text: "Standby Pump — ON" },
                        { id: "fuel-comptr-light-11", kind: "action", label: "11", text: "Jet Pump — OFF" },
                      ],
                    }],
                  },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "eng-chip-light",
      title: "ENG CHIP LIGHT",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-12", "ENG CHIP LIGHT")],
      stages: [
        sourceAll(
          "eng-chip-light-a12",
          "Affected Engine",
          "A-12",
          "ENG CHIP LIGHT",
          [
            { id: "eng-chip-light-1", kind: "action", label: "1", text: "Engine Instruments — MONITOR" },
            { id: "eng-chip-light-2", kind: "action", label: "2", text: "Investigate cause at earliest possible maintenance." },
          ],
        ),
      ],
    },
    {
      id: "engine-overspeed",
      title: "ENGINE OVERSPEED",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-12", "ENGINE OVERSPEED")],
      stages: [
        sourceAll(
          "engine-overspeed-a12",
          "Affected Engine",
          "A-12",
          "ENGINE OVERSPEED",
          [
            { id: "engine-overspeed-1", kind: "action", label: "1", text: "Thrust Lever — RETARD" },
            {
              id: "engine-overspeed-fuel-computer",
              kind: "information",
              text: "Do not set affected engine Fuel Computer Switch OFF.",
            },
            {
              id: "engine-overspeed-no-response",
              kind: "condition",
              branches: [{
                id: "engine-overspeed-no-response-branch",
                label: "2. If engine does not respond to thrust lever movement",
                steps: [
                  {
                    id: "engine-overspeed-2",
                    kind: "action",
                    text: "Shut down engine. Refer to ENGINE SHUTDOWN IN FLIGHT procedure, this page.",
                  },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "engine-shutdown-in-flight",
      title: "ENGINE SHUTDOWN IN FLIGHT",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-12", "ENGINE SHUTDOWN IN FLIGHT")],
      stages: [
        sourceAll(
          "engine-shutdown-a12",
          "Affected Engine",
          "A-12",
          "ENGINE SHUTDOWN IN FLIGHT",
          [
            { id: "engine-shutdown-1", kind: "action", label: "1", text: "Engine Sync — OFF" },
            { id: "engine-shutdown-2", kind: "action", label: "2", text: "Thrust Lever — CUTOFF" },
            { id: "engine-shutdown-3", kind: "action", label: "3", text: "Rudder Trim — AS REQ’D" },
            { id: "engine-shutdown-4", kind: "action", label: "4", text: "Yaw Damper — ENGAGE" },
            { id: "engine-shutdown-5", kind: "action", label: "5", text: "Ignition — OFF" },
            { id: "engine-shutdown-6", kind: "action", label: "6", text: "Start-Gen Switch — OFF" },
            { id: "engine-shutdown-7", kind: "action", label: "7", text: "Electrical Load — REDUCE" },
            { id: "engine-shutdown-8", kind: "action", label: "8", text: "Bleed Air — OFF" },
            { id: "engine-shutdown-9", kind: "action", label: "9", text: "Crossflow Valve — OPEN, CROSSFLOW AS REQ’D" },
            {
              id: "engine-shutdown-10",
              kind: "action",
              label: "10",
              text: "Refer to AIRSTART procedure, Tab 5, Emergency Checklist or SINGLE-ENGINE LANDING procedure, Tab 14, this section.",
            },
          ],
        ),
      ],
    },
    {
      id: "starter-engaged-light-remains-illuminated",
      title: "STARTER ENGAGED LIGHT REMAINS ILLUMINATED",
      procedureClass: "abnormal",
      category: "Engine",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-13", "STARTER ENGAGED LIGHT REMAINS ILLUMINATED")],
      stages: [
        sourceAll(
          "starter-engaged-ground-start-a13",
          "Ground Start",
          "A-13",
          "STARTER ENGAGED LIGHT REMAINS ILLUMINATED — Ground Start",
          [
            { id: "starter-engaged-ground-1", kind: "action", label: "1", text: "Affected Start-Gen Switch — GEN" },
            { id: "starter-engaged-ground-2", kind: "action", label: "2", text: "Affected Engine — SHUT DOWN" },
            { id: "starter-engaged-ground-3", kind: "action", label: "3", text: "Electrical Power — OFF" },
            { id: "starter-engaged-ground-4", kind: "action", label: "4", text: "Do not dispatch until trouble has been corrected." },
          ],
        ),
        sourceAll(
          "starter-engaged-airstart-a13",
          "Starter-Assist Airstart",
          "A-13",
          "STARTER ENGAGED LIGHT REMAINS ILLUMINATED — Starter-Assist Airstart",
          [
            { id: "starter-engaged-airstart-1", kind: "action", label: "1", text: "Airstart Procedure — COMPLETE" },
            { id: "starter-engaged-airstart-2", kind: "action", label: "2", text: "Affected Start-Gen Switch — GEN" },
            {
              id: "starter-engaged-first-result",
              kind: "condition",
              branches: [
                {
                  id: "starter-engaged-first-out",
                  label: "If light goes out",
                  steps: [
                    { id: "starter-engaged-first-out-a", kind: "action", label: "a", text: "Continue flight." },
                    { id: "starter-engaged-first-out-b", kind: "action", label: "b", text: "Correct trouble before next flight." },
                  ],
                },
                {
                  id: "starter-engaged-first-remains",
                  label: "If light remains illuminated",
                  steps: [
                    { id: "starter-engaged-first-remains-a", kind: "action", label: "a", text: "Affected IGN & ST CB (main power bus) — PULL" },
                    { id: "starter-engaged-first-remains-b", kind: "information", label: "b", text: "Corresponding generator will be inoperative." },
                    {
                      id: "starter-engaged-second-result",
                      kind: "condition",
                      branches: [
                        {
                          id: "starter-engaged-second-out",
                          label: "If light goes out",
                          steps: [
                            { id: "starter-engaged-second-out-1", kind: "action", label: "(1)", text: "Continue flight." },
                            {
                              id: "starter-engaged-second-out-2",
                              kind: "action",
                              label: "(2)",
                              text: "Refer to GENERATOR FAILURE (SINGLE) procedure, Tab 3, this section.",
                            },
                            { id: "starter-engaged-second-out-3", kind: "action", label: "(3)", text: "Correct trouble before next flight." },
                          ],
                        },
                        {
                          id: "starter-engaged-second-remains",
                          label: "If light remains illuminated",
                          steps: [
                            { id: "starter-engaged-second-remains-1", kind: "action", label: "(1)", text: "Affected IGN & ST CB — RESET" },
                            { id: "starter-engaged-second-remains-2", kind: "action", label: "(2)", text: "Land as soon as practical." },
                            { id: "starter-engaged-second-remains-3", kind: "action", label: "(3)", text: "Correct trouble before next flight." },
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
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
