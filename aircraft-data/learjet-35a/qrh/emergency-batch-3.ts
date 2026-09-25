import type { AircraftAbnormalEmergencyV2Content } from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

const envelopeBoundary =
  "Staged only: this procedure requires verification against the CL-102B E-13 AIRSTART ENVELOPE. E-13 remains fail-closed until the generic QRH can preserve its graphical operating envelope without loss.";

export const learjet35aQrhEmergencyBatch3ReleaseStatus = "staged-source-review" as const;

export const learjet35aQrhEmergencyBatch3BlockedDependencies = [
  {
    id: "airstart-envelope",
    pageLabel: "E-13",
    reason:
      "Every staged airstart procedure begins by assuring the E-13 airstart envelope. The textual procedures may be reviewed independently, but this batch must not be published operationally until the graphical envelope has a source-faithful generic representation.",
  },
] as const;

/**
 * QRH.3C textual airstart source batch.
 *
 * E-14 through E-18 can be represented faithfully as textual procedures, but
 * they all depend on the graphical E-13 AIRSTART ENVELOPE. For that reason the
 * entire batch remains staged/unpublished even though each procedure is fully
 * source-reviewed and uses ALL-aircraft effectivity.
 */
export const learjet35aQrhEmergencyBatch3 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 3",
  sourcePolicy: "available-sources",
  sourceNote:
    "Partial QRH.3C source digitization from CL-102B Change 2 Emergency Procedures. Textual airstart procedures are staged but operational publication is blocked by the unresolved E-13 graphical Airstart Envelope dependency.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "starter-assist-airstart-fuel-computer-on",
      title: "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)",
      procedureClass: "emergency",
      category: "Engine",
      boundaryNote: envelopeBoundary,
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-14–E-15", "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)")],
      stages: [
        {
          id: "starter-assist-on-affected-engine",
          label: "Affected Engine",
          sources: [source("E-14–E-15", "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)")],
          steps: [
            { id: "sa-on-1", kind: "action", label: "1", text: "Assure airstart envelope." },
            { id: "sa-on-2", kind: "action", label: "2", text: "Thrust Lever — CUTOFF" },
            { id: "sa-on-wait", kind: "information", text: "Wait 10 seconds for fuel to drain." },
            { id: "sa-on-3a", kind: "information", label: "3a", text: "Fuel available from wing tank." },
            { id: "sa-on-3b", kind: "action", label: "3b", text: "Engine Fire Pull Handle — PUSH IN" },
            { id: "sa-on-4a", kind: "action", label: "4a", text: "Jet Pump or Standby Pump — ON" },
            { id: "sa-on-4b", kind: "action", label: "4b", text: "Crossflow Valve — CLOSE" },
            { id: "sa-on-4c", kind: "action", label: "4c", text: "Transfer-Fill — OFF" },
            { id: "sa-on-4d", kind: "action", label: "4d", text: "Fuselage Valve (if installed) — CLOSE" },
            { id: "sa-on-5", kind: "action", label: "5", text: "Electrical Load — REDUCE" },
            { id: "sa-on-6", kind: "action", label: "6", text: "Nacelle Heat — OFF" },
            { id: "sa-on-7", kind: "action", label: "7", text: "Bleed Air — OFF" },
            { id: "sa-on-8", kind: "action", label: "8", text: "Start-Gen Switch — START" },
            { id: "sa-on-9", kind: "action", label: "9", text: "Thrust Lever @ 10% N2 & Fan Rotation — IDLE" },
            { id: "sa-on-10", kind: "action", label: "10", text: "Air Ignition Light & Fuel Flow — CHECK" },
            { id: "sa-on-11", kind: "action", label: "11", text: "Turbine Temp (ITT) — RISE (within 5 seconds)" },
            {
              id: "sa-on-12",
              kind: "condition",
              branches: [
                {
                  id: "sa-on-no-lightoff-5",
                  label: "12. If no light-off within 5 seconds",
                  steps: [
                    { id: "sa-on-12-action", kind: "action", text: "SPR Switch — ENERGIZE UNTIL 300° - 400° ITT" },
                  ],
                },
              ],
            },
            { id: "sa-on-13", kind: "action", label: "13", text: "Air Ignition & Starter Engaged Lights (if installed) — OUT" },
            { id: "sa-on-14", kind: "action", label: "14", text: "Start-Gen Switch — GEN @ IDLE" },
            { id: "sa-on-15", kind: "action", label: "15", text: "Engine Instruments — NORMAL" },
            { id: "sa-on-16", kind: "action", label: "16", text: "Bleed Air — ON" },
            { id: "sa-on-17", kind: "action", label: "17", text: "Nacelle Heat — AS REQ’D" },
            {
              id: "sa-on-no-lightoff-10",
              kind: "condition",
              branches: [
                {
                  id: "sa-on-no-lightoff-10-branch",
                  label: "If no light-off within 10 seconds total",
                  steps: [
                    { id: "sa-on-18", kind: "action", label: "18", text: "Thrust Lever — CUTOFF" },
                    { id: "sa-on-19", kind: "action", label: "19", text: "Start-Gen Switch — OFF" },
                    { id: "sa-on-20", kind: "action", label: "20", text: "Repeat STARTER-ASSIST AIRSTART (FUEL COMPUTER ON) procedure." },
                  ],
                },
              ],
            },
            {
              id: "sa-on-will-not-restart",
              kind: "condition",
              sources: [source("E-15", "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)")],
              branches: [
                {
                  id: "sa-on-will-not-restart-branch",
                  label: "If engine will not restart",
                  steps: [
                    { id: "sa-on-21", kind: "action", label: "21", text: "Perform WINDMILLING AIRSTART (FUEL COMPUTER ON) procedure, Tab 6, this section." },
                  ],
                },
              ],
            },
            {
              id: "sa-on-both-operating",
              kind: "condition",
              sources: [source("E-15", "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)")],
              branches: [
                {
                  id: "sa-on-both-operating-branch",
                  label: "After both engines are operating",
                  steps: [
                    { id: "sa-on-22", kind: "action", label: "22", text: "Starter Disengagement (if required) — CHECK" },
                    { id: "sa-on-23", kind: "action", label: "23", text: "Current Limiters — CHECK" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "windmilling-airstart-fuel-computer-on",
      title: "WINDMILLING AIRSTART (FUEL COMPUTER ON)",
      procedureClass: "emergency",
      category: "Engine",
      boundaryNote: envelopeBoundary,
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-15–E-16", "WINDMILLING AIRSTART (FUEL COMPUTER ON)")],
      stages: [
        {
          id: "windmill-on-affected-engine",
          label: "Affected Engine",
          sources: [source("E-15–E-16", "WINDMILLING AIRSTART (FUEL COMPUTER ON)")],
          steps: [
            { id: "wm-on-1", kind: "action", label: "1", text: "Assure airstart envelope (15% N2 & fan rotation)." },
            { id: "wm-on-2", kind: "action", label: "2", text: "Thrust Lever — CUTOFF" },
            { id: "wm-on-wait", kind: "information", text: "Wait 10 seconds for fuel to drain." },
            { id: "wm-on-3a", kind: "information", label: "3a", text: "Fuel available from wing tank." },
            { id: "wm-on-3b", kind: "action", label: "3b", text: "Engine Fire Pull Handle — PUSH IN" },
            { id: "wm-on-4a", kind: "action", label: "4a", text: "Jet Pump — ON" },
            { id: "wm-on-4b", kind: "action", label: "4b", text: "Standby Pump — ON" },
            { id: "wm-on-4c", kind: "action", label: "4c", text: "Crossflow Valve — CLOSE" },
            { id: "wm-on-4d", kind: "action", label: "4d", text: "Transfer-Fill — OFF" },
            { id: "wm-on-4e", kind: "action", label: "4e", text: "Fuselage Valve (if installed) — CLOSE" },
            { id: "wm-on-5", kind: "action", label: "5", text: "Start-Gen Switch — OFF" },
            { id: "wm-on-6", kind: "action", label: "6", text: "Electrical Load — REDUCE" },
            { id: "wm-on-7", kind: "action", label: "7", text: "Nacelle Heat — OFF" },
            { id: "wm-on-8", kind: "action", label: "8", text: "Bleed Air — OFF" },
            { id: "wm-on-9", kind: "action", label: "9", text: "Air Ignition — ON" },
            { id: "wm-on-10", kind: "action", label: "10", text: "Thrust Lever — IDLE, CHECK FUEL FLOW" },
            { id: "wm-on-11", kind: "action", label: "11", text: "Turbine Temp (ITT) — RISE (within 5 seconds)" },
            {
              id: "wm-on-12",
              kind: "condition",
              branches: [
                {
                  id: "wm-on-no-lightoff-5",
                  label: "12. If no light-off within 5 seconds",
                  steps: [
                    { id: "wm-on-12-action", kind: "action", text: "SPR Switch — ENERGIZE UNTIL 300° - 400° ITT" },
                  ],
                },
              ],
            },
            { id: "wm-on-13", kind: "action", label: "13", text: "Air Ignition — OFF @ 45% N2" },
            { id: "wm-on-14", kind: "action", label: "14", text: "Start-Gen Switch — GEN @ IDLE" },
            { id: "wm-on-15", kind: "action", label: "15", text: "Engine Instruments — NORMAL" },
            { id: "wm-on-16", kind: "action", label: "16", text: "Standby Pump — OFF" },
            { id: "wm-on-17", kind: "action", label: "17", text: "Bleed Air — ON" },
            { id: "wm-on-18", kind: "action", label: "18", text: "Nacelle Heat — AS REQ’D" },
            {
              id: "wm-on-no-lightoff-10",
              kind: "condition",
              sources: [source("E-16", "WINDMILLING AIRSTART (FUEL COMPUTER ON)")],
              branches: [
                {
                  id: "wm-on-no-lightoff-10-branch",
                  label: "If no light-off within 10 seconds",
                  steps: [
                    { id: "wm-on-19", kind: "action", label: "19", text: "Thrust Lever — CUTOFF" },
                    { id: "wm-on-20", kind: "action", label: "20", text: "Air Ignition — OFF" },
                    { id: "wm-on-21", kind: "action", label: "21", text: "Perform WINDMILLING AIRSTART (FUEL COMPUTER ON) procedure or STARTER–ASSIST AIRSTART (FUEL COMPUTER ON) procedure, Tab 6, this section." },
                  ],
                },
              ],
            },
            {
              id: "wm-on-will-not-restart",
              kind: "condition",
              sources: [source("E-16", "WINDMILLING AIRSTART (FUEL COMPUTER ON)")],
              branches: [
                {
                  id: "wm-on-will-not-restart-branch",
                  label: "If engine will not restart",
                  steps: [
                    { id: "wm-on-22", kind: "action", label: "22", text: "Perform ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist." },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "starter-assist-airstart-fuel-computer-off",
      title: "STARTER–ASSIST AIRSTART (FUEL COMPUTER OFF)",
      procedureClass: "emergency",
      category: "Engine",
      boundaryNote: envelopeBoundary,
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-16–E-17", "STARTER–ASSIST AIRSTART (FUEL COMPUTER OFF)")],
      stages: [
        {
          id: "starter-assist-off-affected-engine",
          label: "Affected Engine",
          sources: [source("E-16–E-17", "STARTER–ASSIST AIRSTART (FUEL COMPUTER OFF)")],
          steps: [
            { id: "sa-off-1", kind: "action", label: "1", text: "Assure airstart envelope (below 20,000 feet)" },
            { id: "sa-off-2", kind: "action", label: "2", text: "Fuel Computer — OFF" },
            { id: "sa-off-3", kind: "action", label: "3", text: "Thrust Lever — CUTOFF" },
            { id: "sa-off-wait", kind: "information", text: "Wait 10 seconds for fuel to drain." },
            { id: "sa-off-4a", kind: "information", label: "4a", text: "Fuel available from wing tank." },
            { id: "sa-off-4b", kind: "action", label: "4b", text: "Engine Fire Pull Handle — PUSH IN" },
            { id: "sa-off-5a", kind: "action", label: "5a", text: "Standby Pump — ON" },
            { id: "sa-off-5b", kind: "action", label: "5b", text: "Jet Pump — OFF" },
            { id: "sa-off-5c", kind: "action", label: "5c", text: "Crossflow Valve — CLOSE" },
            { id: "sa-off-5d", kind: "action", label: "5d", text: "Transfer-Fill — OFF" },
            { id: "sa-off-5e", kind: "action", label: "5e", text: "Fuselage Valve (if installed) — CLOSE" },
            { id: "sa-off-6", kind: "action", label: "6", text: "Electrical Load — REDUCE" },
            { id: "sa-off-7", kind: "action", label: "7", text: "Nacelle Heat — OFF" },
            { id: "sa-off-8", kind: "action", label: "8", text: "Bleed Air — OFF" },
            { id: "sa-off-9", kind: "action", label: "9", text: "Start-Gen Switch — START" },
            { id: "sa-off-10", kind: "action", label: "10", text: "Thrust Lever @ 10% N2 & Fan Rotation — IDLE" },
            { id: "sa-off-11", kind: "action", label: "11", text: "Air Ignition Light & Fuel Flow — CHECK" },
            { id: "sa-off-12", kind: "action", label: "12", text: "Turbine Temp (ITT) — RISE (within 10 seconds)" },
            {
              id: "sa-off-13",
              kind: "information",
              label: "13",
              text: "Start-Gen Switch: a. @ 45% N2 — OFF; b. @ Idle — GEN",
            },
            { id: "sa-off-14", kind: "action", label: "14", text: "Air Ignition & Starter Engaged Lights (if installed) — OUT" },
            { id: "sa-off-15", kind: "action", label: "15", text: "Engine Instruments — MONITOR" },
            { id: "sa-off-16", kind: "action", label: "16", text: "Bleed Air — ON" },
            { id: "sa-off-17", kind: "action", label: "17", text: "Nacelle Heat — AS REQ’D" },
            {
              id: "sa-off-no-lightoff-10",
              kind: "condition",
              branches: [
                {
                  id: "sa-off-no-lightoff-10-branch",
                  label: "If no light-off within 10 seconds",
                  steps: [
                    { id: "sa-off-18", kind: "action", label: "18", text: "Thrust Lever — CUTOFF" },
                    { id: "sa-off-19", kind: "action", label: "19", text: "Start-Gen Switch — OFF" },
                    { id: "sa-off-20", kind: "action", label: "20", text: "Repeat STARTER-ASSIST AIRSTART (FUEL COMPUTER OFF) procedure." },
                  ],
                },
              ],
            },
            {
              id: "sa-off-will-not-restart",
              kind: "condition",
              branches: [
                {
                  id: "sa-off-will-not-restart-branch",
                  label: "If engine will not restart",
                  steps: [
                    { id: "sa-off-21", kind: "action", label: "21", text: "Perform WINDMILLING AIRSTART (FUEL COMPUTER OFF) procedure, next page." },
                  ],
                },
              ],
            },
            {
              id: "sa-off-both-operating",
              kind: "condition",
              branches: [
                {
                  id: "sa-off-both-operating-branch",
                  label: "After both engines are operating",
                  steps: [
                    { id: "sa-off-22", kind: "action", label: "22", text: "Starter Disengagement (if required) — CHECK" },
                    { id: "sa-off-23", kind: "action", label: "23", text: "Current Limiters — CHECK" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "windmilling-airstart-fuel-computer-off",
      title: "WINDMILLING AIRSTART (FUEL COMPUTER OFF)",
      procedureClass: "emergency",
      category: "Engine",
      boundaryNote: envelopeBoundary,
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-18–E-19", "WINDMILLING AIRSTART (FUEL COMPUTER OFF)")],
      stages: [
        {
          id: "windmill-off-affected-engine",
          label: "Affected Engine",
          sources: [source("E-18–E-19", "WINDMILLING AIRSTART (FUEL COMPUTER OFF)")],
          steps: [
            { id: "wm-off-1", kind: "action", label: "1", text: "Assure airstart envelope (15% N2, 10% N1 & below 20,000 feet)" },
            { id: "wm-off-2", kind: "action", label: "2", text: "Fuel Computer — OFF" },
            { id: "wm-off-3", kind: "action", label: "3", text: "Thrust Lever — CUTOFF" },
            { id: "wm-off-wait", kind: "information", text: "Wait 10 seconds for fuel to drain." },
            { id: "wm-off-4a", kind: "information", label: "4a", text: "Fuel available from wing tank." },
            { id: "wm-off-4b", kind: "action", label: "4b", text: "Engine Fire Pull Handle — PUSH IN" },
            { id: "wm-off-5a", kind: "action", label: "5a", text: "Jet Pump — OFF" },
            { id: "wm-off-5b", kind: "action", label: "5b", text: "Standby Pump — ON" },
            { id: "wm-off-5c", kind: "action", label: "5c", text: "Crossflow Valve — CLOSE" },
            { id: "wm-off-5d", kind: "action", label: "5d", text: "Transfer-Fill — OFF" },
            { id: "wm-off-5e", kind: "action", label: "5e", text: "Fuselage Valve (if installed) — CLOSE" },
            { id: "wm-off-6", kind: "action", label: "6", text: "Start-Gen Switch — OFF" },
            { id: "wm-off-7", kind: "action", label: "7", text: "Electrical Load — REDUCE" },
            { id: "wm-off-8", kind: "action", label: "8", text: "Nacelle Heat — OFF" },
            { id: "wm-off-9", kind: "action", label: "9", text: "Bleed Air — OFF" },
            { id: "wm-off-10", kind: "action", label: "10", text: "Air Ignition — ON" },
            { id: "wm-off-11", kind: "action", label: "11", text: "Thrust Lever — IDLE, CHECK FUEL FLOW" },
            { id: "wm-off-12", kind: "action", label: "12", text: "Turbine Temp (ITT) — RISE (within 10 seconds)" },
            { id: "wm-off-13", kind: "action", label: "13", text: "Engine Instruments — MONITOR" },
            { id: "wm-off-14", kind: "action", label: "14", text: "Air Ignition — OFF @ 45% N2" },
            { id: "wm-off-15", kind: "action", label: "15", text: "Start-Gen Switch — GEN @ IDLE" },
            { id: "wm-off-16", kind: "action", label: "16", text: "Bleed Air — ON" },
            { id: "wm-off-17", kind: "action", label: "17", text: "Nacelle Heat — AS REQ’D" },
            {
              id: "wm-off-no-lightoff-10",
              kind: "condition",
              branches: [
                {
                  id: "wm-off-no-lightoff-10-branch",
                  label: "If no light-off within 10 seconds",
                  steps: [
                    { id: "wm-off-18", kind: "action", label: "18", text: "Thrust Lever — CUTOFF" },
                    { id: "wm-off-19", kind: "action", label: "19", text: "Air Ignition — OFF" },
                    { id: "wm-off-20", kind: "action", label: "20", text: "Perform WINDMILLING AIRSTART (FUEL COMPUTER OFF) procedure or STARTER–ASSIST AIRSTART (FUEL COMPUTER OFF) procedure, Tab 7, this section." },
                  ],
                },
              ],
            },
            {
              id: "wm-off-will-not-restart",
              kind: "condition",
              sources: [source("E-19", "WINDMILLING AIRSTART (FUEL COMPUTER OFF)")],
              branches: [
                {
                  id: "wm-off-will-not-restart-branch",
                  label: "If engine will not restart",
                  steps: [
                    { id: "wm-off-21", kind: "action", label: "21", text: "Perform ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist." },
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
