import type { AircraftAbnormalEmergencyV2Content } from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

export const learjet35aQrhEmergencyBatch1ReleaseStatus = "staged-source-review" as const;

/**
 * QRH.3A source digitization batch.
 *
 * This payload is deliberately not wired to a release helper or bundled
 * learner fallback. It is a partial, source-reviewed slice used to validate
 * exact CL-102B procedure semantics before the complete Learjet QRH package
 * is assembled and published through governance.
 */
export const learjet35aQrhEmergencyBatch1 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 1",
  sourcePolicy: "available-sources",
  sourceNote:
    "Partial QRH.3 source digitization from CL-102B Change 2 Emergency Procedures. Not a complete publishable Learjet QRH package.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  sectionIntroductions: [
    {
      procedureClass: "emergency",
      paragraphs: [
        "This section contains those operating procedures requiring the use of special systems and/or regular systems in order to protect the occupants and the aircraft from harm during a critical situation requiring immediate response.",
        "The procedures located in this section supplement Normal Procedures when an emergency condition exists. Use of Normal Procedures should be continued when applicable. Sound judgement as well as thorough knowledge of the aircraft, its characteristics, and the flight manual procedures are essential in the handling of any emergency situation.",
        "In addition to the outlined items in the emergency procedures, the following steps are considered part of all emergency situations: Maintain Airplane Control; Analyze the Situation; Take Proper Action.",
      ],
      sources: [source("E-i", "Emergency Procedures")],
    },
  ],
  scenarios: [
    {
      id: "door-light",
      title: "DOOR LIGHT ILLUMINATED",
      procedureClass: "emergency",
      category: "Doors",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-4", "DOOR LIGHT")],
      stages: [
        {
          id: "door-light-response",
          label: "DOOR LIGHT ILLUMINATED",
          sources: [source("E-4", "DOOR LIGHT")],
          steps: [
            {
              id: "door-light-condition",
              kind: "condition",
              sources: [source("E-4", "DOOR LIGHT")],
              branches: [
                {
                  id: "door-failure-evidence",
                  label: "If light was accompanied by evidence of door failure",
                  steps: [
                    {
                      id: "door-failure-do-not-approach",
                      kind: "action",
                      label: "•",
                      text: "DO NOT APPROACH DOOR",
                    },
                    {
                      id: "door-failure-seat-belt",
                      kind: "action",
                      label: "1",
                      text: "FASTEN SEAT BELT Switch — ON",
                    },
                    {
                      id: "door-failure-cabin-altitude",
                      kind: "action",
                      label: "2",
                      text: "Cabin Altitude — UP TO MAX POSSIBLE",
                    },
                    {
                      id: "door-failure-airspeed",
                      kind: "action",
                      label: "3",
                      text: "Airspeed — REDUCE",
                    },
                    {
                      id: "door-failure-descent",
                      kind: "action",
                      label: "4",
                      text: "Establish descent.",
                    },
                    {
                      id: "door-failure-land",
                      kind: "action",
                      label: "5",
                      text: "Land as soon as practical.",
                    },
                  ],
                },
                {
                  id: "door-no-failure-evidence",
                  label: "If light was not accompanied by evidence of door failure",
                  steps: [
                    {
                      id: "door-no-failure-do-not-approach",
                      kind: "action",
                      label: "•",
                      text: "DO NOT APPROACH DOOR",
                    },
                    {
                      id: "door-no-failure-seat-belt",
                      kind: "action",
                      label: "1",
                      text: "FASTEN SEAT BELT Switch — ON",
                    },
                    {
                      id: "door-no-failure-continue",
                      kind: "action",
                      label: "2",
                      text: "Continue Flight. Probable cause is latch pin switch malfunction.",
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
      id: "ac-inverter-failure-total",
      title: "AC INVERTER FAILURE — TOTAL",
      procedureClass: "emergency",
      category: "Electrical",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-5", "AC INVERTER FAILURE — TOTAL")],
      stages: [
        {
          id: "ac-inverter-failure-response",
          label: "AC INVERTER FAILURE — TOTAL",
          sources: [source("E-5", "AC INVERTER FAILURE — TOTAL")],
          steps: [
            { id: "ac-inverter-1", kind: "action", label: "1", text: "Maintain aircraft control by reference to the standby attitude gyro." },
            { id: "ac-inverter-2", kind: "action", label: "2", text: "Avoid flight in instrument conditions." },
            { id: "ac-inverter-3", kind: "action", label: "3", text: "AC BUS TIE CB (Copilot’s Panel) — PULL" },
            { id: "ac-inverter-4", kind: "action", label: "4", text: "PRI & SEC INV CBs (Pilot’s & Copilot’s Main Power Bus) and L & R AC BUS CBs (Pilot’s & Copilot’s AC Bus) — IN" },
            { id: "ac-inverter-5", kind: "action", label: "5", text: "AC Load — REDUCE" },
            { id: "ac-inverter-6", kind: "action", label: "6", text: "Inverter Switches — OFF THEN ON" },
            {
              id: "ac-inverter-not-regained",
              kind: "condition",
              branches: [
                {
                  id: "ac-inverter-not-regained-branch",
                  label: "If AC power is not regained",
                  steps: [
                    { id: "ac-inverter-7", kind: "action", label: "7", text: "PRI & SEC INV CBs — PULL & RESET" },
                    {
                      id: "ac-inverter-still-not-regained",
                      kind: "condition",
                      branches: [
                        {
                          id: "ac-inverter-still-not-regained-branch",
                          label: "If AC power is not regained",
                          steps: [
                            {
                              id: "ac-inverter-8",
                              kind: "information",
                              label: "8",
                              text: "The following is a partial list of equipment that will not be usable:\n• Vertical & Directional Gyros\n• Autopilot\n• Yaw Dampers\n• Mach Trim System\n• Avionics Displays\n• Electrical Servoed Altimeter(s)\n• Engine Oil Pressure Indicators\n• Spoilerons\n• Spoilers (inoperative in flight only)\n• Nose Wheel Steering\n• Windshield Electric Defog (if installed)",
                            },
                            { id: "ac-inverter-9", kind: "action", label: "9", text: "Mach Trim will be inoperative. Do not exceed MMO (.74MI)." },
                            { id: "ac-inverter-10", kind: "action", label: "10", text: "Maintaining not less than 250 KIAS until approach will improve stability." },
                          ],
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
    },
    {
      id: "generator-failure-dual",
      title: "GENERATOR FAILURE (DUAL)",
      procedureClass: "emergency",
      category: "Electrical",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-9–E-10", "GENERATOR FAILURE (DUAL)")],
      stages: [
        {
          id: "generator-failure-dual-response",
          label: "GENERATOR FAILURE (DUAL)",
          sources: [source("E-9–E-10", "GENERATOR FAILURE (DUAL)")],
          steps: [
            { id: "generator-dual-1", kind: "action", label: "1", text: "Electrical Load — REDUCE" },
            { id: "generator-dual-1a", kind: "action", label: "a", text: "Air Conditioner — OFF" },
            { id: "generator-dual-1b", kind: "action", label: "b", text: "Aux Heat (if installed) — OFF" },
            { id: "generator-dual-1c", kind: "action", label: "c", text: "Windshield Aux Defog (if installed) — OFF" },
            { id: "generator-dual-2", kind: "action", label: "2", text: "IGN & ST CBs (main power buses) — CHECK & RESET" },
            { id: "generator-dual-3", kind: "action", label: "3", text: "Start-Gen Switches — GEN" },
            { id: "generator-dual-4", kind: "action", label: "4", text: "Generator Reset Switches — DEPRESS (momentarily)" },
            {
              id: "generator-dual-first-reset-failed",
              kind: "condition",
              branches: [
                {
                  id: "generator-dual-first-reset-failed-branch",
                  label: "If generators do not reset",
                  steps: [
                    { id: "generator-dual-5", kind: "action", label: "5", text: "Turbine Speed (N2) — 80% or ABOVE" },
                    { id: "generator-dual-6", kind: "action", label: "6", text: "Start-Gen Switches — OFF, then GEN" },
                    { id: "generator-dual-7", kind: "action", label: "7", text: "Generator Reset Switches — DEPRESS (momentarily)" },
                    {
                      id: "generator-dual-second-reset-failed",
                      kind: "condition",
                      branches: [
                        {
                          id: "generator-dual-second-reset-failed-branch",
                          label: "If generators do not reset",
                          steps: [
                            { id: "generator-dual-8", kind: "action", label: "8", text: "Start-Gen Switches — OFF" },
                            { id: "generator-dual-9", kind: "action", label: "9", text: "Jet Pumps — ON" },
                            { id: "generator-dual-10", kind: "action", label: "10", text: "Fuel Computer Switches (one at a time) — OFF" },
                            { id: "generator-dual-10a", kind: "information", label: "a", text: "Engine response will be much slower." },
                            {
                              id: "generator-dual-engine-accelerates",
                              kind: "condition",
                              branches: [
                                {
                                  id: "generator-dual-engine-accelerates-branch",
                                  label: "If an engine accelerates uncontrolled",
                                  steps: [
                                    { id: "generator-dual-10b", kind: "action", label: "b", text: "Applicable Fuel Computer Switch — ON" },
                                  ],
                                },
                              ],
                            },
                            {
                              id: "generator-dual-fuselage-fuel",
                              kind: "condition",
                              branches: [
                                {
                                  id: "generator-dual-fuselage-fuel-branch",
                                  label: "If there is fuel in fuselage tank",
                                  steps: [
                                    {
                                      id: "generator-dual-fuselage-valve-configuration",
                                      kind: "condition",
                                      branches: [
                                        {
                                          id: "generator-dual-without-fuselage-valve-switch",
                                          label: "Aircraft without Fuselage Valve Switch",
                                          steps: [
                                            { id: "generator-dual-11a-xfer", kind: "action", label: "a", text: "XFER-FILL Switch — XFER" },
                                            { id: "generator-dual-11b-cb", kind: "action", label: "b", text: "FUSLG PMP CB (copilot’s main bus) — PULL" },
                                          ],
                                        },
                                        {
                                          id: "generator-dual-with-fuselage-valve-switch",
                                          label: "Aircraft with Fuselage Valve Switch",
                                          steps: [
                                            { id: "generator-dual-11a-valve", kind: "action", label: "a", text: "Fuselage Valve — OPEN" },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            { id: "generator-dual-12", kind: "action", label: "12", text: "Land as soon as practical." },
                            { id: "generator-dual-13", kind: "action", label: "13", text: "All Non-essential Equipment — OFF or CBs PULLED" },
                            { id: "generator-dual-battery-duration", kind: "information", text: "Fully charged batteries should power minimum equipment for night IFR for approximately 30 minutes." },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: "generator-dual-batteries-depleted",
              kind: "condition",
              sources: [source("E-10", "GENERATOR FAILURE (DUAL)")],
              branches: [
                {
                  id: "generator-dual-batteries-depleted-branch",
                  label: "If ship’s batteries are depleted",
                  steps: [
                    { id: "generator-dual-14", kind: "information", label: "14", text: "Power will be supplied by emergency battery." },
                    { id: "generator-dual-14a", kind: "action", label: "a", text: "Emergency Power — STBY" },
                    { id: "generator-dual-14b", kind: "action", label: "b", text: "For gear & flap operation, Emergency Power — ON" },
                    { id: "generator-dual-15", kind: "action", label: "15", text: "Secondary Emergency Power (if installed) — ON" },
                    { id: "generator-dual-16", kind: "action", label: "16", text: "Refer to Supplemental Data, pages S-6 and S-7 for a list of conditions using emergency batteries." },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "engine-failure",
      title: "ENGINE FAILURE",
      procedureClass: "emergency",
      category: "Engine",
      effectivity: {
        kind: "all-aircraft",
        sourceText: "ALL",
      },
      sources: [source("E-10–E-11", "ENGINE FAILURE")],
      stages: [
        {
          id: "engine-failure-takeoff-below-v1",
          label: "DURING TAKEOFF — Below V1 Speed",
          sources: [source("E-10", "ENGINE FAILURE")],
          steps: [
            {
              id: "engine-failure-below-v1-1",
              kind: "action",
              label: "1",
              text: "Thrust Levers — IDLE",
              memoryItem: true,
            },
            {
              id: "engine-failure-below-v1-2",
              kind: "action",
              label: "2",
              text: "Wheel Brakes — APPLY",
              memoryItem: true,
            },
            {
              id: "engine-failure-below-v1-3",
              kind: "action",
              label: "3",
              text: "Spoilers — EXTEND",
              memoryItem: true,
            },
            {
              id: "engine-failure-below-v1-4",
              kind: "action",
              label: "4",
              text: "Drag Chute or Thrust Reversers (if installed) — DEPLOY, IF NECESSARY",
            },
          ],
        },
        {
          id: "engine-failure-takeoff-above-v1",
          label: "DURING TAKEOFF — Above V1 Speed",
          sources: [source("E-10", "ENGINE FAILURE")],
          steps: [
            {
              id: "engine-failure-above-v1-1",
              kind: "action",
              label: "1",
              text: "Rudder & Ailerons — AS REQ’D",
              memoryItem: true,
            },
            {
              id: "engine-failure-above-v1-2",
              kind: "action",
              label: "2",
              text: "Accelerate to VR. Keep nose wheel on runway.",
              memoryItem: true,
            },
            {
              id: "engine-failure-above-v1-3",
              kind: "action",
              label: "3",
              text: "Rotate at VR; Climb at V2.",
              memoryItem: true,
            },
            {
              id: "engine-failure-above-v1-4",
              kind: "action",
              label: "4",
              text: "Positive Rate Of Climb Established — GEAR UP",
              memoryItem: true,
            },
            {
              id: "engine-failure-above-v1-5",
              kind: "action",
              label: "5",
              text: "Clear of Obstacles — V2 + 30, FLAPS-UP",
              memoryItem: true,
            },
            {
              id: "engine-failure-above-v1-6",
              kind: "action",
              label: "6",
              text: "Fuel Jettison — ON; Fuel Jettison — OFF (prior to touchdown)",
            },
            {
              id: "engine-failure-above-v1-7",
              kind: "action",
              label: "7",
              text: "Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist or ENGINE FIRE — SHUTDOWN procedure, Tab 5, this section.",
            },
          ],
        },
        {
          id: "engine-failure-in-flight",
          label: "IN FLIGHT",
          sources: [source("E-11", "ENGINE FAILURE")],
          steps: [
            {
              id: "engine-failure-in-flight-1",
              kind: "action",
              label: "1",
              text: "Control Wheel Master Switch (MSW) — DEPRESS & RELEASE",
            },
            {
              id: "engine-failure-in-flight-2",
              kind: "action",
              label: "2",
              text: "Rudder & Ailerons — AS REQ’D",
            },
            {
              id: "engine-failure-in-flight-3",
              kind: "action",
              label: "3",
              text: "Thrust Lever (operative engine) — INCREASE, AS REQ’D",
            },
            {
              id: "engine-failure-in-flight-4",
              kind: "action",
              label: "4",
              text: "Engine Sync — OFF",
            },
            {
              id: "engine-failure-in-flight-5",
              kind: "action",
              label: "5",
              text: "Rudder Trim — AS REQ’D",
            },
            {
              id: "engine-failure-in-flight-6",
              kind: "action",
              label: "6",
              text: "Yaw Damper — ENGAGE",
            },
            {
              id: "engine-failure-in-flight-7",
              kind: "action",
              label: "7",
              text: "Autopilot — AS DESIRED",
            },
            {
              id: "engine-failure-in-flight-8",
              kind: "action",
              label: "8",
              text: "Refer to ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist.",
            },
          ],
        },
        {
          id: "engine-failure-during-approach",
          label: "DURING APPROACH",
          sources: [source("E-11", "ENGINE FAILURE")],
          steps: [
            {
              id: "engine-failure-approach-1",
              kind: "action",
              label: "1",
              text: "Control Wheel Master Switch (MSW) — DEPRESS",
              memoryItem: true,
            },
            {
              id: "engine-failure-approach-2",
              kind: "action",
              label: "2",
              text: "Thrust Lever (operative engine) — INCREASE, AS REQ’D",
              memoryItem: true,
            },
            {
              id: "engine-failure-approach-3",
              kind: "action",
              label: "3",
              text: "Flaps — 20° MAX",
              memoryItem: true,
            },
            {
              id: "engine-failure-approach-4",
              kind: "action",
              label: "4",
              text: "Airspeed — VREF + 10 MIN",
              memoryItem: true,
            },
            {
              id: "engine-failure-approach-5",
              kind: "action",
              label: "5",
              text: "Rudder Trim — AS REQ’D",
            },
            {
              id: "engine-failure-approach-6",
              kind: "action",
              label: "6",
              text: "Yaw Damper — ENGAGE",
            },
            {
              id: "engine-failure-approach-7",
              kind: "action",
              label: "7",
              text: "Autopilot — AS DESIRED",
            },
            {
              id: "engine-failure-approach-8",
              kind: "action",
              label: "8",
              text: "Refer to applicable procedure(s): SINGLE-ENGINE LANDING procedure, Tab 14, Abnormal Checklist; GO AROUND procedure, Normal Checklist; ENGINE SHUTDOWN IN FLIGHT procedure, Tab 5, Abnormal Checklist.",
            },
          ],
        },
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
