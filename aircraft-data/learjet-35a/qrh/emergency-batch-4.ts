import type { AircraftAbnormalEmergencyV2Content } from "../../../lib/universal-abnormal-emergency.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

export const learjet35aQrhEmergencyBatch4ReleaseStatus = "staged-source-review" as const;

export const learjet35aQrhEmergencyBatch4DeferredEffectivity = [
  {
    id: "bleed-air-light",
    pages: ["E-20", "E-20.1", "E-20.2"],
    reason:
      "BLEED AIR LIGHT is split by aircraft serial ranges and AMK 76-7 status. The current generic configuration contract cannot prove those serial ranges, so the family remains fail-closed rather than selecting a source variant by inference.",
  },
  {
    id: "cabin-cockpit-fire-smoke-fumes",
    pages: ["E-22", "E-22.1", "E-23", "E-23.1", "E-24"],
    reason:
      "CABIN/COCKPIT FIRE, SMOKE, OR FUMES spans multiple serial/AMK effectivity families before converging on E-24. Keep the procedure family fail-closed until serial-range applicability is represented explicitly.",
  },
] as const;

/**
 * QRH.3D all-aircraft Emergency Procedures batch.
 *
 * Only procedures whose CL-102B pages are explicitly ALL-aircraft are staged
 * here. Serial/AMK-specific E-20 and E-22/E-23 families remain separate,
 * documented fail-closed dependencies.
 */
export const learjet35aQrhEmergencyBatch4 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 4",
  sourcePolicy: "available-sources",
  sourceNote:
    "Partial QRH.3D source digitization from CL-102B Change 2 Emergency Procedures. This batch intentionally contains only reviewed ALL-aircraft pages from E-21 and E-25 through E-33.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "cabin-altitude-warning-emergency-descent",
      title: "CABIN ALTITUDE WARNING HORN ACTIVATES OR CABIN ALTITUDE EXCEEDS 10,000 FEET (EMERGENCY DESCENT)",
      procedureClass: "emergency",
      category: "Environmental/Door",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-21", "CABIN ALTITUDE WARNING HORN / EMERGENCY DESCENT")],
      stages: [{
        id: "emergency-descent-response",
        label: "Emergency Descent",
        sources: [source("E-21", "CABIN ALTITUDE WARNING HORN / EMERGENCY DESCENT")],
        steps: [
          { id: "ed-1", kind: "action", label: "1", text: "Crew Oxygen Masks — DON & SELECT 100%", memoryItem: true },
          { id: "ed-2", kind: "action", label: "2", text: "Thrust Levers — IDLE", memoryItem: true },
          { id: "ed-3", kind: "action", label: "3", text: "Autopilot — DISENGAGE", memoryItem: true },
          { id: "ed-4", kind: "action", label: "4", text: "Spoilers — EXTEND", memoryItem: true },
          { id: "ed-5", kind: "action", label: "5", text: "Landing Gear (Below MMO or VLE) — DOWN", memoryItem: true },
          { id: "ed-6", kind: "action", label: "6", text: "Descend at MMO/VLE, but not below minimum safe altitude.", memoryItem: true },
          { id: "ed-7", kind: "action", label: "7", text: "PASS OXY Valve — NORM", memoryItem: true },
          { id: "ed-8", kind: "action", label: "8", text: "PASS MASK Valve — MAN", memoryItem: true },
          {
            id: "ed-if-time",
            kind: "condition",
            branches: [{
              id: "ed-if-time-branch",
              label: "If time and conditions permit",
              steps: [
                { id: "ed-9", kind: "action", label: "9", text: "OXY-MIC Switches — ON" },
                { id: "ed-10", kind: "action", label: "10", text: "Transponder — 7700" },
                { id: "ed-11", kind: "action", label: "11", text: "Notify ATC." },
                { id: "ed-12", kind: "action", label: "12", text: "Check and assist passengers." },
              ],
            }],
          },
        ],
      }],
    },
    {
      id: "control-system-jam",
      title: "CONTROL SYSTEM JAM",
      procedureClass: "emergency",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-25", "CONTROL SYSTEM JAM")],
      stages: [
        {
          id: "control-jam-guidance",
          label: "General Guidance",
          sources: [source("E-25", "CONTROL SYSTEM JAM")],
          steps: [
            { id: "control-jam-info-1", kind: "information", text: "Refer to PITCH AXIS MALFUNCTION procedure, Tab 12, this section, or ROLL OR YAW AXIS MALFUNCTION procedure, Tab 13, this section, to clear difficulty." },
            { id: "control-jam-info-2", kind: "information", text: "If problem not corrected, attempt to overpower jam. If jam can be overpowered, make normal landing." },
            { id: "control-jam-info-3", kind: "information", text: "For landing with control jam, fly long, straight-in approach and establish final configuration at a safe altitude." },
          ],
        },
        {
          id: "aileron-jam",
          label: "AILERON JAM",
          sources: [source("E-25", "CONTROL SYSTEM JAM — AILERON JAM")],
          steps: [
            { id: "aileron-jam-1", kind: "action", label: "1", text: "Rudder — AS REQ’D TO MAINTAIN CONTROL" },
            { id: "aileron-jam-1a", kind: "action", text: "Yaw Damper — ON" },
            { id: "aileron-jam-1b", kind: "action", text: "Crossflow Valve — OPEN" },
            { id: "aileron-jam-1c", kind: "action", text: "Standby Pumps — ON" },
            { id: "aileron-jam-2", kind: "action", label: "2", text: "Approach Configuration — GEAR DN, FLAPS 20°" },
            { id: "aileron-jam-3", kind: "action", label: "3", text: "Approach Speed — VREF + 10" },
            { id: "aileron-jam-4", kind: "action", label: "4", text: "Maintain power to touchdown and do not flare." },
          ],
        },
        {
          id: "elevator-jam",
          label: "ELEVATOR JAM",
          sources: [source("E-25", "CONTROL SYSTEM JAM — ELEVATOR JAM")],
          steps: [
            { id: "elevator-jam-1", kind: "action", label: "1", text: "Primary Pitch Trim — AS REQ’D TO MAINTAIN CONTROL" },
            { id: "elevator-jam-2", kind: "action", label: "2", text: "Approach Configuration — GEAR DN, FLAPS 20°" },
            { id: "elevator-jam-3", kind: "action", label: "3", text: "Approach Speed — VREF + 10" },
            { id: "elevator-jam-4", kind: "action", label: "4", text: "Maintain power to touchdown and do not flare." },
          ],
        },
        {
          id: "rudder-jam",
          label: "RUDDER JAM",
          sources: [source("E-25", "CONTROL SYSTEM JAM — RUDDER JAM")],
          steps: [
            { id: "rudder-jam-1", kind: "action", label: "1", text: "Aileron — AS REQ’D TO MAINTAIN CONTROL" },
            { id: "rudder-jam-2", kind: "action", label: "2", text: "Use asymmetric power if required to minimize sideslip." },
            { id: "rudder-jam-2a", kind: "action", text: "Crossflow Valve — OPEN" },
            { id: "rudder-jam-2b", kind: "action", text: "Standby Pumps — ON" },
            { id: "rudder-jam-3", kind: "action", label: "3", text: "Approach Configuration — GEAR DN, FLAPS 20°" },
            { id: "rudder-jam-4", kind: "action", label: "4", text: "Approach Speed — VREF + 10" },
            { id: "rudder-jam-5", kind: "action", label: "5", text: "Maintain power to touchdown and do not flare." },
            { id: "rudder-jam-6", kind: "action", label: "6", text: "After landing, maintain directional control with differential braking." },
          ],
        },
      ],
    },
    {
      id: "overspeed-recovery",
      title: "OVERSPEED RECOVERY — OVERSPEED WARNING HORN ACTIVATES",
      procedureClass: "emergency",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-26", "OVERSPEED RECOVERY")],
      stages: [{
        id: "overspeed-response",
        label: "Overspeed Recovery",
        sources: [source("E-26", "OVERSPEED RECOVERY")],
        steps: [
          { id: "overspeed-1", kind: "action", label: "1", text: "Thrust Levers — IDLE", memoryItem: true },
          { id: "overspeed-2", kind: "action", label: "2", text: "Autopilot — DISENGAGE", memoryItem: true },
          { id: "overspeed-3", kind: "action", label: "3", text: "Identify aircraft pitch and roll attitude.", memoryItem: true },
          { id: "overspeed-4", kind: "action", label: "4", text: "Level wings.", memoryItem: true },
          { id: "overspeed-5", kind: "action", label: "5", text: "Elevator and Pitch Trim — NOSE UP AS REQ’D", memoryItem: true },
          {
            id: "overspeed-severe",
            kind: "condition",
            branches: [{
              id: "overspeed-severe-branch",
              label: "If Mach or airspeed is severe or if pitch and/or roll attitude is extreme or unknown",
              memoryItem: true,
              steps: [
                { id: "overspeed-6", kind: "action", label: "6", text: "Landing Gear — DOWN, DO NOT RETRACT GEAR", memoryItem: true },
              ],
            }],
          },
        ],
      }],
    },
    {
      id: "pitch-axis-malfunction",
      title: "PITCH AXIS MALFUNCTION",
      procedureClass: "emergency",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-27", "PITCH AXIS MALFUNCTION")],
      stages: [{
        id: "pitch-axis-response",
        label: "Pitch Axis Malfunction",
        sources: [source("E-27", "PITCH AXIS MALFUNCTION")],
        steps: [
          { id: "pitch-1", kind: "action", label: "1", text: "Control Wheel Master Switch (MSW) — DEPRESS & HOLD", memoryItem: true },
          { id: "pitch-2", kind: "action", label: "2", text: "Attitude Control — AS REQ’D", memoryItem: true },
          {
            id: "pitch-3",
            kind: "condition",
            branches: [
              {
                id: "pitch-high-speed-nose-down",
                label: "3. If high-speed nose-down attitude",
                memoryItem: true,
                steps: [{ id: "pitch-3a", kind: "action", text: "Thrust Levers — IDLE", memoryItem: true }],
              },
              {
                id: "pitch-near-stall",
                label: "3. If near stall",
                memoryItem: true,
                steps: [{ id: "pitch-3b", kind: "action", text: "Thrust Levers — INCREASE AS REQ’D", memoryItem: true }],
              },
            ],
          },
          { id: "pitch-4", kind: "action", label: "4", text: "Both Stall Warning Switches — OFF", memoryItem: true },
          { id: "pitch-5", kind: "action", label: "5", text: "Pitch Trim Switch — OFF", memoryItem: true },
          { id: "pitch-6", kind: "action", label: "6", text: "Autopilot Switch — OFF", memoryItem: true },
          { id: "pitch-7", kind: "action", label: "7", text: "Control Wheel Master Switch — RELEASE" },
          { id: "pitch-8", kind: "action", label: "8", text: "Yaw Damper — ENGAGE" },
          {
            id: "pitch-isolate",
            kind: "condition",
            branches: [{
              id: "pitch-isolate-branch",
              label: "If conditions permit, isolate malfunction",
              steps: [
                { id: "pitch-9", kind: "action", label: "9", text: "Pitch Trim Switch — PRI then SEC" },
                {
                  id: "pitch-9-result",
                  kind: "condition",
                  branches: [
                    {
                      id: "pitch-malfunction-recurs",
                      label: "If malfunction recurs in PRI or SEC trim",
                      steps: [
                        { id: "pitch-9a1", kind: "action", label: "a", text: "Select opposite system and use for remainder of flight." },
                        { id: "pitch-9a2", kind: "action", label: "b", text: "Malfunctioning System CB — PITCH TRIM (pilot’s ess bus) or SEC PITCH TRIM (copilot’s ess bus) — PULL" },
                        { id: "pitch-9a3", kind: "information", label: "c", text: "If Mach Trim & Autopilot Inoperative — MMO = 0.74 MI" },
                      ],
                    },
                    {
                      id: "pitch-malfunction-does-not-recur",
                      label: "If malfunction does not recur",
                      steps: [
                        { id: "pitch-9b1", kind: "action", label: "a", text: "Pitch Trim Switch — PRI or SEC" },
                        { id: "pitch-9b2", kind: "action", label: "b", text: "Do not engage autopilot." },
                      ],
                    },
                    {
                      id: "pitch-trim-cannot-restore",
                      label: "If pitch trim cannot be restored",
                      steps: [
                        { id: "pitch-9c1", kind: "action", text: "Refer to JAMMED STABILIZER LANDING procedure, Tab 14, Abnormal Checklist." },
                      ],
                    },
                  ],
                },
                { id: "pitch-10", kind: "action", label: "10", text: "Stall Warning Systems (one at a time) — ON" },
                {
                  id: "pitch-10-result",
                  kind: "condition",
                  branches: [
                    {
                      id: "pitch-stall-warning-recurs",
                      label: "If malfunction recurs",
                      steps: [
                        { id: "pitch-10a", kind: "action", text: "Set malfunctioning system switch OFF and refer to STALL WARNING SYSTEM FAILURE procedure, Tab 8, Abnormal Checklist." },
                      ],
                    },
                    {
                      id: "pitch-stall-warning-no-recur",
                      label: "If malfunction does not recur",
                      steps: [{ id: "pitch-10b", kind: "action", text: "Do not engage autopilot." }],
                    },
                  ],
                },
              ],
            }],
          },
          { id: "pitch-11", kind: "action", label: "11", text: "Autopilot (if not cause of malfunction) — AS DESIRED" },
          { id: "pitch-12", kind: "action", label: "12", text: "Yaw Damper (PRI or SEC) — ENGAGE" },
        ],
      }],
    },
    {
      id: "roll-or-yaw-axis-malfunction",
      title: "ROLL OR YAW AXIS MALFUNCTION",
      procedureClass: "emergency",
      category: "Flight Controls",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-28", "ROLL OR YAW AXIS MALFUNCTION")],
      stages: [{
        id: "roll-yaw-response",
        label: "Roll or Yaw Axis Malfunction",
        sources: [source("E-28", "ROLL OR YAW AXIS MALFUNCTION")],
        steps: [
          { id: "roll-yaw-1", kind: "action", label: "1", text: "Control Wheel Master Switch — DEPRESS", memoryItem: true },
          { id: "roll-yaw-2", kind: "action", label: "2", text: "Attitude Control — AS REQ’D", memoryItem: true },
          {
            id: "roll-yaw-force-continues",
            kind: "condition",
            branches: [{
              id: "roll-yaw-force-continues-branch",
              label: "If control force continues",
              memoryItem: true,
              steps: [
                { id: "roll-yaw-3", kind: "action", label: "3", text: "Airspeed — REDUCE", memoryItem: true },
                { id: "roll-yaw-4", kind: "action", label: "4", text: "Affected Axis Trim CB — ROLL TRIM or YAW TRIM (pilot’s ess bus) — PULL", memoryItem: true },
              ],
            }],
          },
          {
            id: "roll-yaw-5",
            kind: "condition",
            branches: [
              {
                id: "roll-yaw-yaw-damper",
                label: "5. If malfunction isolated to yaw damper",
                steps: [{ id: "roll-yaw-5a", kind: "action", label: "a", text: "Select opposite yaw damper." }],
              },
              {
                id: "roll-yaw-autopilot",
                label: "If malfunction isolated to autopilot",
                steps: [
                  { id: "roll-yaw-5b1", kind: "action", label: "a", text: "Do not engage autopilot." },
                  { id: "roll-yaw-5b2", kind: "action", label: "b", text: "Reengage yaw damper." },
                ],
              },
              {
                id: "roll-yaw-trim",
                label: "If malfunction isolated to roll or yaw trim",
                steps: [
                  { id: "roll-yaw-5c1", kind: "information", label: "a", text: "Minimize mistrim by using asymmetric thrust and fuel imbalance." },
                  { id: "roll-yaw-5c2", kind: "action", label: "b", text: "Land as soon as practical." },
                ],
              },
            ],
          },
        ],
      }],
    },
    {
      id: "fuel-press-light",
      title: "FUEL PRESS LIGHT",
      procedureClass: "emergency",
      category: "Fuel",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-29", "FUEL PRESS LIGHT")],
      stages: [{
        id: "fuel-press-affected-engine",
        label: "Affected Engine",
        sources: [source("E-29", "FUEL PRESS LIGHT")],
        steps: [
          { id: "fuel-press-1", kind: "action", label: "1", text: "Thrust Lever — RETARD" },
          { id: "fuel-press-2", kind: "action", label: "2", text: "Standby Pump — ON" },
          { id: "fuel-press-3", kind: "action", label: "3", text: "Ignition — ON" },
          { id: "fuel-press-4", kind: "action", label: "4", text: "Crossflow Valve — CLOSE" },
          { id: "fuel-press-5", kind: "action", label: "5", text: "Transfer-Fill — OFF" },
          { id: "fuel-press-6", kind: "action", label: "6", text: "Fuselage Valve (if installed) — CLOSE" },
          { id: "fuel-press-7", kind: "action", label: "7", text: "Jet Pump — ON" },
          {
            id: "fuel-press-first-check",
            kind: "condition",
            branches: [{
              id: "fuel-press-first-check-branch",
              label: "If FUEL PRESS light does not extinguish",
              steps: [{ id: "fuel-press-8", kind: "action", label: "8", text: "Jet Pump — OFF" }],
            }],
          },
          {
            id: "fuel-press-second-check",
            kind: "condition",
            branches: [{
              id: "fuel-press-second-check-branch",
              label: "If FUEL PRESS light does not extinguish",
              steps: [{ id: "fuel-press-9", kind: "action", label: "9", text: "Descend to 25,000 feet or lower." }],
            }],
          },
        ],
      }],
    },
    {
      id: "ditching",
      title: "DITCHING",
      procedureClass: "emergency",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-30", "DITCHING")],
      stages: [{
        id: "ditching-response",
        label: "Ditching",
        sources: [source("E-30", "DITCHING")],
        steps: [
          {
            id: "ditching-if-time",
            kind: "condition",
            branches: [{
              id: "ditching-if-time-branch",
              label: "1. If time permits",
              steps: [
                { id: "ditching-1a", kind: "action", label: "a", text: "Head toward nearest land or vessel." },
                { id: "ditching-1b", kind: "action", label: "b", text: "Notify ATC." },
                { id: "ditching-1c", kind: "action", label: "c", text: "Transponder — 7700" },
                { id: "ditching-1d", kind: "action", label: "d", text: "ELT (if installed) — ON" },
                { id: "ditching-1e", kind: "action", label: "e", text: "Life Vests — ON" },
                { id: "ditching-1f", kind: "action", label: "f", text: "Passengers — BRIEF" },
                { id: "ditching-1f-info", kind: "information", text: "Brief use of flotation equipment; emergency exits — do not open lower half of cabin door; secure loose items; brace position for emergency landing; do not release seat belts until stopped." },
                { id: "ditching-1g", kind: "action", label: "g", text: "No Smoking/Fasten Seat Belt Sign — ON" },
                { id: "ditching-1h", kind: "action", label: "h", text: "Fuel Jettison — ON (until complete or touchdown)" },
              ],
            }],
          },
          { id: "ditching-2", kind: "action", label: "2", text: "Landing Gear — UP" },
          { id: "ditching-3", kind: "action", label: "3", text: "Flaps — DOWN" },
          { id: "ditching-4", kind: "action", label: "4", text: "Cabin Air — OFF" },
          { id: "ditching-5", kind: "action", label: "5", text: "Emergency Power — OFF" },
          { id: "ditching-6", kind: "action", label: "6", text: "Approach — NORMAL at VREF" },
          {
            id: "ditching-water-condition",
            kind: "condition",
            branches: [
              { id: "ditching-calm-sea", label: "Calm Sea", steps: [{ id: "ditching-calm-sea-action", kind: "action", text: "Land into wind." }] },
              { id: "ditching-moderate-swells", label: "Moderate Swells", steps: [{ id: "ditching-moderate-swells-action", kind: "action", text: "Land parallel to swells." }] },
              { id: "ditching-high-winds", label: "High Winds", steps: [{ id: "ditching-high-winds-action", kind: "action", text: "Land into wind on upwind side of swell." }] },
            ],
          },
          { id: "ditching-7", kind: "action", label: "7", text: "Thrust Levers — CUTOFF @ TOUCHDOWN" },
          { id: "ditching-8", kind: "action", label: "8", text: "Engine Fire Pull Handles — PULL" },
          { id: "ditching-9", kind: "action", label: "9", text: "Batteries — OFF" },
          { id: "ditching-10", kind: "action", label: "10", text: "Emergency Exits (after full stop) — OPEN" },
          { id: "ditching-door-warning", kind: "information", text: "DO NOT OPEN LOWER HALF OF CABIN DOOR" },
        ],
      }],
    },
    {
      id: "emergency-braking",
      title: "EMERGENCY BRAKING",
      procedureClass: "emergency",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-31", "EMERGENCY BRAKING")],
      stages: [{
        id: "emergency-braking-response",
        label: "Emergency Braking",
        sources: [source("E-31", "EMERGENCY BRAKING")],
        steps: [
          { id: "emergency-braking-note", kind: "information", text: "Anti-skid protection is not available during emergency braking." },
          { id: "emergency-braking-1", kind: "action", label: "1", text: "Emergency Brake Handle — PULL OUT", memoryItem: true },
          { id: "emergency-braking-2", kind: "action", label: "2", text: "Emergency Brake Handle — PUSH DOWNWARD", memoryItem: true },
          { id: "emergency-braking-3", kind: "action", label: "3", text: "Rudder and/or Nose Wheel Steering — AS REQ’D" },
        ],
      }],
    },
    {
      id: "emergency-evacuation",
      title: "EMERGENCY EVACUATION",
      procedureClass: "emergency",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-31", "EMERGENCY EVACUATION")],
      stages: [{
        id: "emergency-evacuation-response",
        label: "Emergency Evacuation",
        sources: [source("E-31", "EMERGENCY EVACUATION")],
        steps: [
          { id: "evac-1", kind: "action", label: "1", text: "Stop the aircraft.", memoryItem: true },
          { id: "evac-2", kind: "action", label: "2", text: "Parking Brake — SET", memoryItem: true },
          { id: "evac-3", kind: "action", label: "3", text: "Thrust Levers — CUTOFF", memoryItem: true },
          {
            id: "evac-4",
            kind: "condition",
            branches: [
              {
                id: "evac-fire-suspected",
                label: "4. If an engine fire is suspected",
                memoryItem: true,
                steps: [
                  { id: "evac-4a", kind: "action", label: "a", text: "Applicable Engine Fire Pull Handle — PULL", memoryItem: true },
                  { id: "evac-4b", kind: "action", label: "b", text: "ARMED Light — DEPRESS ONE", memoryItem: true },
                  { id: "evac-4c", kind: "action", label: "c", text: "Other Engine Fire Pull Handle — PULL", memoryItem: true },
                ],
              },
              {
                id: "evac-fire-not-suspected",
                label: "If engine fire is not suspected",
                memoryItem: true,
                steps: [
                  { id: "evac-4d", kind: "action", label: "a", text: "Both Engine Fire Pull Handles — PULL", memoryItem: true },
                ],
              },
            ],
          },
          { id: "evac-5", kind: "action", label: "5", text: "Batteries — OFF", memoryItem: true },
          {
            id: "evac-6",
            kind: "condition",
            branches: [{
              id: "evac-6-branch",
              label: "6. Evacuate the aircraft",
              steps: [
                { id: "evac-6a", kind: "action", label: "a", text: "Cabin Entry Door — OPEN & EXIT" },
                { id: "evac-6b", kind: "action", label: "b", text: "Aft Cabin Emergency Exit — OPEN & EXIT" },
              ],
            }],
          },
        ],
      }],
    },
    {
      id: "landing-both-engines-inop",
      title: "LANDING — BOTH ENGINES INOP",
      procedureClass: "emergency",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-32", "LANDING — BOTH ENGINES INOP")],
      stages: [{
        id: "both-engines-inop-landing",
        label: "Landing — Both Engines Inoperative",
        sources: [source("E-32", "LANDING — BOTH ENGINES INOP")],
        steps: [
          { id: "both-engines-info-1", kind: "information", text: "Airplane Best Glide Speed (gear & flaps up) is VREF + 60 KIAS." },
          { id: "both-engines-info-2", kind: "information", text: "The still-air gliding distance is approximately 2 nm per 1000 feet of altitude." },
          {
            id: "both-engines-if-time",
            kind: "condition",
            branches: [{
              id: "both-engines-if-time-branch",
              label: "1. If time permits",
              steps: [
                { id: "both-engines-1a", kind: "action", label: "a", text: "Transponder — 7700" },
                { id: "both-engines-1b", kind: "action", label: "b", text: "Notify ATC." },
                { id: "both-engines-1c", kind: "action", label: "c", text: "Prepare passengers for emergency landing." },
                { id: "both-engines-1d", kind: "action", label: "d", text: "No Smoking Fasten Seat Belt Sign — ON" },
              ],
            }],
          },
          { id: "both-engines-2", kind: "action", label: "2", text: "Fuel Jettison — ON" },
          { id: "both-engines-2-off", kind: "action", text: "Fuel Jettison — OFF (prior to touchdown)" },
          { id: "both-engines-3", kind: "action", label: "3", text: "Auxiliary Hydraulic Pump — ON" },
          { id: "both-engines-4", kind: "action", label: "4", text: "Landing Gear — DOWN" },
          { id: "both-engines-5", kind: "action", label: "5", text: "Flaps — FULL DOWN" },
          { id: "both-engines-6", kind: "action", label: "6", text: "Engine Fire Pull Handles — PULL" },
          { id: "both-engines-7", kind: "action", label: "7", text: "Start-Gen Switches — OFF" },
          { id: "both-engines-8", kind: "action", label: "8", text: "Batteries — OFF" },
          { id: "both-engines-9", kind: "action", label: "9", text: "Emergency Power (prior to touchdown) — OFF" },
          { id: "both-engines-10", kind: "action", label: "10", text: "Touchdown in normal landing attitude." },
          {
            id: "both-engines-11",
            kind: "condition",
            branches: [{
              id: "both-engines-11-branch",
              label: "11. Evacuate the aircraft",
              steps: [
                { id: "both-engines-11a", kind: "action", label: "a", text: "Cabin Entry Door — OPEN & EXIT" },
                { id: "both-engines-11b", kind: "action", label: "b", text: "Aft Cabin Emergency Exit — OPEN & EXIT" },
              ],
            }],
          },
        ],
      }],
    },
    {
      id: "stall-warning-activates",
      title: "STALL WARNING ACTIVATES",
      procedureClass: "emergency",
      category: "Stall Warning",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-33", "STALL WARNING ACTIVATES")],
      stages: [{
        id: "stall-warning-response",
        label: "Stall Warning",
        sources: [source("E-33", "STALL WARNING ACTIVATES")],
        steps: [
          { id: "stall-1", kind: "action", label: "1", text: "Lower the pitch attitude to reduce angle of attack.", memoryItem: true },
          { id: "stall-2", kind: "action", label: "2", text: "Thrust Levers — TAKEOFF POWER", memoryItem: true },
          { id: "stall-3", kind: "action", label: "3", text: "Level the wings.", memoryItem: true },
          { id: "stall-4", kind: "action", label: "4", text: "Accelerate out of the stall condition.", memoryItem: true },
        ],
      }],
    },
    {
      id: "aborted-takeoff",
      title: "ABORTED TAKEOFF",
      procedureClass: "emergency",
      category: "Takeoff",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("E-33", "ABORTED TAKEOFF")],
      stages: [{
        id: "aborted-takeoff-response",
        label: "Aborted Takeoff",
        sources: [source("E-33", "ABORTED TAKEOFF")],
        steps: [
          { id: "abort-1", kind: "action", label: "1", text: "Thrust Levers — IDLE", memoryItem: true },
          { id: "abort-2", kind: "action", label: "2", text: "Wheel Brakes — APPLY", memoryItem: true },
          { id: "abort-3", kind: "action", label: "3", text: "Spoilers — EXTEND", memoryItem: true },
          { id: "abort-4", kind: "action", label: "4", text: "Drag Chute or Thrust Reversers (if installed) — AS REQ’D" },
          { id: "abort-5", kind: "action", label: "5", text: "Refer to the AFM for further disposition." },
        ],
      }],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
