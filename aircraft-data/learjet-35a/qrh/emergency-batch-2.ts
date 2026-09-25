import type { AircraftAbnormalEmergencyV2Content } from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

export const learjet35aQrhEmergencyBatch2ReleaseStatus = "staged-source-review" as const;

export const learjet35aQrhEmergencyBatch2Deferred = [
  {
    id: "airstart-envelope",
    title: "AIRSTART ENVELOPE",
    pageLabel: "E-13",
    reason:
      "The source contains a graphical operating envelope whose geometry cannot be represented by the current textual QRH step contract without loss. Keep fail-closed until generic source-figure support is defined.",
  },
] as const;

/**
 * QRH.3B source digitization batch.
 *
 * This batch remains deliberately unbundled and unpublished. It contains only
 * procedures whose reviewed source semantics can be represented without
 * inventing effectivity, memory status, or graphical operating limits.
 */
export const learjet35aQrhEmergencyBatch2 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 2",
  sourcePolicy: "available-sources",
  sourceNote:
    "Partial QRH.3B source digitization from CL-102B Change 2 Emergency Procedures. Not a complete publishable Learjet QRH package.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "engine-fire-shutdown",
      title: "ENGINE FIRE — SHUTDOWN",
      procedureClass: "emergency",
      category: "Engine",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-12", "ENGINE FIRE — SHUTDOWN")],
      stages: [
        {
          id: "engine-fire-affected-engine",
          label: "Affected Engine",
          sources: [source("E-12", "ENGINE FIRE — SHUTDOWN")],
          steps: [
            {
              id: "engine-fire-1",
              kind: "action",
              label: "1",
              text: "Thrust Lever — IDLE, UNLESS A CRITICAL THRUST SITUATION EXISTS",
              memoryItem: true,
            },
            {
              id: "engine-fire-duration",
              kind: "condition",
              branches: [
                {
                  id: "engine-fire-more-than-15",
                  label: "2. If fire continues more than 15 seconds or there are other indications of fire",
                  memoryItem: true,
                  steps: [
                    {
                      id: "engine-fire-2a",
                      kind: "action",
                      label: "a",
                      text: "Thrust Lever — CUTOFF",
                      memoryItem: true,
                    },
                    {
                      id: "engine-fire-2b",
                      kind: "action",
                      label: "b",
                      text: "Engine Fire Pull Handle — PULL",
                      memoryItem: true,
                    },
                    {
                      id: "engine-fire-2c",
                      kind: "action",
                      label: "c",
                      text: "ARMED Light — DEPRESS ONE",
                      memoryItem: true,
                    },
                    {
                      id: "engine-fire-2d",
                      kind: "condition",
                      branches: [
                        {
                          id: "engine-fire-continues",
                          label: "d. If fire continues",
                          steps: [
                            {
                              id: "engine-fire-2d1",
                              kind: "action",
                              label: "(1)",
                              text: "Remaining ARMED light — DEPRESS",
                            },
                            {
                              id: "engine-fire-2d2",
                              kind: "action",
                              label: "(2)",
                              text: "Land as soon as possible.",
                            },
                            {
                              id: "engine-fire-2d3",
                              kind: "action",
                              label: "(3)",
                              text: "Go to step e.",
                            },
                          ],
                        },
                        {
                          id: "engine-fire-extinguishes-after-15",
                          label: "If fire extinguishes",
                          steps: [
                            {
                              id: "engine-fire-2d-ext-1",
                              kind: "action",
                              label: "(1)",
                              text: "Land as soon as practical.",
                            },
                            {
                              id: "engine-fire-2d-ext-2",
                              kind: "action",
                              label: "(2)",
                              text: "Go to step e.",
                            },
                          ],
                        },
                      ],
                    },
                    { id: "engine-fire-2e", kind: "action", label: "e", text: "Ignition — OFF" },
                    { id: "engine-fire-2f", kind: "action", label: "f", text: "Engine Sync — OFF" },
                    { id: "engine-fire-2g", kind: "action", label: "g", text: "Yaw Damper OFF, retrim, then — ENGAGE" },
                    { id: "engine-fire-2h", kind: "action", label: "h", text: "Jet Pump & Standby Pump — OFF" },
                    { id: "engine-fire-2i", kind: "action", label: "i", text: "Start-Gen Switch — OFF" },
                    { id: "engine-fire-2j", kind: "action", label: "j", text: "Electrical Load — REDUCE, IF REQ’D" },
                    { id: "engine-fire-2k", kind: "action", label: "k", text: "Crossflow Valve — OPEN, CROSSFLOW AS REQ’D" },
                    {
                      id: "engine-fire-2l",
                      kind: "action",
                      label: "l",
                      text: "Refer to SINGLE-ENGINE LANDING procedure, Tab 14, Abnormal Checklist.",
                    },
                  ],
                },
                {
                  id: "engine-fire-less-than-15",
                  label: "If fire extinguishes in less than 15 seconds",
                  steps: [
                    {
                      id: "engine-fire-short-a",
                      kind: "action",
                      label: "a",
                      text: "Leave thrust lever at IDLE, unless a critical thrust situation exists.",
                    },
                    { id: "engine-fire-short-b", kind: "action", label: "b", text: "Engine Sync — OFF" },
                    { id: "engine-fire-short-c", kind: "action", label: "c", text: "Yaw Damper OFF, retrim, then — ENGAGE" },
                    {
                      id: "engine-fire-short-d",
                      kind: "action",
                      label: "d",
                      text: "Fuel Balance — MONITOR, CROSSFLOW AS REQ’D",
                    },
                    { id: "engine-fire-short-e", kind: "action", label: "e", text: "Land as soon as practical." },
                    {
                      id: "engine-fire-short-f",
                      kind: "action",
                      label: "f",
                      text: "Refer to SINGLE-ENGINE LANDING procedure, Tab 14, Abnormal Checklist.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "oil-pressure-lights",
      title: "OIL PRESSURE LIGHT(S)",
      procedureClass: "emergency",
      category: "Engine",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-19", "OIL PRESSURE LIGHT(S)")],
      stages: [
        {
          id: "oil-pressure-response",
          label: "OIL PRESSURE LIGHT(S)",
          sources: [source("E-19", "OIL PRESSURE LIGHT(S)")],
          steps: [
            {
              id: "oil-pressure-1",
              kind: "action",
              label: "1",
              text: "Both Oil Pressure Indicators — CHECK",
            },
            {
              id: "oil-pressure-2",
              kind: "action",
              label: "2",
              text: "Oil Temperature Indicator — CHECK",
            },
            {
              id: "oil-pressure-3",
              kind: "condition",
              branches: [
                {
                  id: "oil-pressure-less-than-25",
                  label: "3. Oil pressure is less than 25 psi",
                  steps: [
                    {
                      id: "oil-pressure-less-than-25-action",
                      kind: "action",
                      text: "If flight conditions permit, shut down affected engine. Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist.",
                    },
                  ],
                },
                {
                  id: "oil-pressure-25-to-38-or-hot",
                  label: "Oil pressure is between 25 & 38 psi or oil temperature is high",
                  steps: [
                    {
                      id: "oil-pressure-25-to-38-or-hot-action",
                      kind: "action",
                      text: "If flight conditions permit, reduce power to maintain oil temperature limits.",
                    },
                  ],
                },
                {
                  id: "oil-pressure-normal",
                  label: "Oil pressure & oil temperature are normal",
                  steps: [
                    {
                      id: "oil-pressure-normal-action",
                      kind: "action",
                      text: "Continue to monitor engine operation.",
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
} as const satisfies AircraftAbnormalEmergencyV2Content;
