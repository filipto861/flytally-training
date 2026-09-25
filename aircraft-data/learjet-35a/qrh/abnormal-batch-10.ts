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

const tr4000: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhThrustReverserConfigurationKeys.tr4000,
  ],
  configurationEquipmentNoneOf: [
    learjet35aQrhThrustReverserConfigurationKeys.aeronca,
  ],
};

export const learjet35aQrhAbnormalBatch10ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3Q Landings Abnormal Procedures source batch.
 *
 * Covers the complete CL-102B Landings index family from A-27 through A-33.2.
 * The first nine procedures are ALL-aircraft. ONE THRUST REVERSER DEPLOYED
 * LANDING is source-qualified to TR-4000 thrust reversers and therefore uses
 * explicit generic configuration-equipment applicability. Visual source review
 * found no boxed memory items; the vertical marks on A-31 are change bars.
 */
export const learjet35aQrhAbnormalBatch10 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 10",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3Q digitizes the complete Landings abnormal family from CL-102B A-27 through A-33.2. The first nine procedures are ALL-aircraft; ONE THRUST REVERSER DEPLOYED LANDING is restricted to explicit TR-4000 thrust-reverser configuration. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "gear-up-landing",
      title: "GEAR UP LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [
        source("A-27", "GEAR UP LANDING"),
        source("A-28", "GEAR UP LANDING"),
      ],
      stages: [
        {
          id: "gear-up-landing-a27-a28",
          label: "GEAR UP LANDING",
          effectivity: { kind: "all-aircraft", sourceText: "ALL" },
          sources: [
            source("A-27", "GEAR UP LANDING"),
            source("A-28", "GEAR UP LANDING"),
          ],
          steps: [
            { id: "gear-up-1", kind: "action", label: "1", text: "Notify ATC." },
            { id: "gear-up-2", kind: "action", label: "2", text: "Passengers — BRIEF" },
            {
              id: "gear-up-2a",
              kind: "information",
              label: "a",
              text: "Location and operation of emergency exits.",
            },
            {
              id: "gear-up-2b",
              kind: "information",
              label: "b",
              text: "All loose items — Secure.",
            },
            {
              id: "gear-up-2c",
              kind: "information",
              label: "c",
              text: "Shoulder harness and seat belts — Secure.",
            },
            {
              id: "gear-up-2d",
              kind: "information",
              label: "d",
              text: "Emergency landing brace position.",
            },
            {
              id: "gear-up-3",
              kind: "action",
              label: "3",
              text: "No Smoking/Fasten Seat Belt Sign — ON",
            },
            { id: "gear-up-4", kind: "action", label: "4", text: "Cabin Air — OFF" },
            { id: "gear-up-5", kind: "action", label: "5", text: "Flaps — DN" },
            {
              id: "gear-up-6",
              kind: "action",
              label: "6",
              text: "Emergency Battery(ies) — OFF",
            },
            {
              id: "gear-up-7",
              kind: "condition",
              branches: [
                {
                  id: "gear-up-none-extended",
                  label: "If no gear have extended",
                  steps: [
                    {
                      id: "gear-up-none-extended-action",
                      kind: "action",
                      label: "7",
                      text: "Touch down slightly nose high.",
                    },
                  ],
                },
                {
                  id: "gear-up-nose-fails",
                  label: "If the nose gear fails to extend",
                  steps: [
                    {
                      id: "gear-up-nose-a",
                      kind: "action",
                      label: "a",
                      text: "Relocate passengers aft to obtain aft CG, if possible.",
                    },
                    {
                      id: "gear-up-nose-b",
                      kind: "action",
                      label: "b",
                      text: "Auxiliary Hydraulic Pump — ON",
                    },
                    {
                      id: "gear-up-nose-c",
                      kind: "action",
                      label: "c",
                      text: "Hold the nose off the runway as long as elevator control is available. If hydraulic pressure is available, normal braking may be available. Use rudder and/or brakes for directional control. Be prepared to use EMER BRAKE. Refer to EMERGENCY BRAKING procedure, Tab 14, Emergency Checklist.",
                    },
                  ],
                },
                {
                  id: "gear-up-main-fails",
                  label: "If a main gear fails to extend",
                  steps: [
                    {
                      id: "gear-up-main-intro",
                      kind: "action",
                      text: "Land on same side of the runway as the extended gear.",
                    },
                    {
                      id: "gear-up-main-a",
                      kind: "action",
                      label: "a",
                      text: "Auxiliary Hydraulic Pump — ON",
                    },
                    {
                      id: "gear-up-main-b",
                      kind: "action",
                      label: "b",
                      text: "Anti-Skid Switch — OFF",
                    },
                    {
                      id: "gear-up-main-c",
                      kind: "action",
                      label: "c",
                      text: "Hold the applicable wing up as long as possible. Maintain directional control with rudder and nose wheel steering. If hydraulic pressure is available, braking may be available. Refer to ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION procedure, Tab 12, this section. Be prepared to use EMER BRAKE. Refer to EMERGENCY BRAKING procedure, Tab 14, Emergency Checklist.",
                    },
                  ],
                },
              ],
            },
            {
              id: "gear-up-8",
              kind: "action",
              label: "8",
              text: "Final Approach Speed — VREF",
            },
            {
              id: "gear-up-9",
              kind: "action",
              label: "9",
              text: "Thrust Levers — CUTOFF @ TOUCHDOWN",
            },
            {
              id: "gear-up-10",
              kind: "action",
              label: "10",
              text: "Engine Fire Pull Handles — PULL",
            },
            {
              id: "gear-up-after-stop",
              kind: "information",
              text: "After aircraft stops:",
            },
            { id: "gear-up-11", kind: "action", label: "11", text: "Batteries — OFF" },
            {
              id: "gear-up-12-info",
              kind: "information",
              label: "12",
              text: "Evacuate the aircraft:",
            },
            {
              id: "gear-up-12a",
              kind: "action",
              label: "a",
              text: "Cabin Entry Door — OPEN & EXIT",
            },
            {
              id: "gear-up-12b",
              kind: "action",
              label: "b",
              text: "Emergency Exit Window — OPEN & EXIT",
            },
          ],
        },
      ],
    },
    {
      id: "hydraulic-system-failure-landing",
      title: "HYDRAULIC SYSTEM FAILURE LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-29", "HYDRAULIC SYSTEM FAILURE LANDING")],
      stages: [
        allStage(
          "hydraulic-system-failure-landing-a29",
          "HYDRAULIC SYSTEM FAILURE LANDING",
          "A-29",
          "HYDRAULIC SYSTEM FAILURE LANDING",
          [
            {
              id: "hyd-landing-1",
              kind: "action",
              label: "1",
              text: "Auxiliary Hydraulic Pump — ON",
            },
            {
              id: "hyd-landing-2",
              kind: "condition",
              branches: [
                {
                  id: "hyd-landing-pressure-available",
                  label: "If auxiliary hydraulic pressure is available",
                  steps: [
                    {
                      id: "hyd-landing-2a-available",
                      kind: "action",
                      label: "a",
                      text: "Flap Switch — DN",
                    },
                    {
                      id: "hyd-landing-2b-info",
                      kind: "information",
                      label: "b",
                      text: "When maximum flap angle is obtained:",
                    },
                    {
                      id: "hyd-landing-2b1",
                      kind: "action",
                      label: "(1)",
                      text: "FLAP Switch — NEUTRAL (if applicable)",
                    },
                    {
                      id: "hyd-landing-2b2",
                      kind: "action",
                      label: "(2)",
                      text: "Auxiliary Hydraulic Pump — OFF",
                    },
                    {
                      id: "hyd-landing-2b3",
                      kind: "information",
                      label: "(3)",
                      text: "Go to step 3.",
                    },
                  ],
                },
                {
                  id: "hyd-landing-pressure-unavailable",
                  label: "If auxiliary hydraulic pressure is not available",
                  steps: [
                    {
                      id: "hyd-landing-2a-unavailable",
                      kind: "action",
                      label: "a",
                      text: "Auxiliary Hydraulic Pump — OFF",
                    },
                    {
                      id: "hyd-landing-2b-unavailable",
                      kind: "information",
                      label: "b",
                      text: "Go to step 3.",
                    },
                  ],
                },
              ],
            },
            {
              id: "hyd-landing-3-info",
              kind: "information",
              label: "3",
              text: "Final Approach Speed — As appropriate for flap deflection:",
            },
            {
              id: "hyd-landing-3-values",
              kind: "information",
              text: "Flaps UP — VREF + 30; Flaps 8° — VREF + 20; Flaps 20° — VREF + 10; Flaps DN — VREF.",
            },
            {
              id: "hyd-landing-4",
              kind: "action",
              label: "4",
              text: "Landing Distance — MULTIPLY by 2.0",
            },
            {
              id: "hyd-landing-5",
              kind: "action",
              label: "5",
              text: "Crew Approach Briefing — COMPLETE",
            },
            {
              id: "hyd-landing-6",
              kind: "action",
              label: "6",
              text: "Emergency Brake Handle — PULL OUT",
            },
            {
              id: "hyd-landing-before",
              kind: "information",
              text: "Just Prior to Landing:",
            },
            {
              id: "hyd-landing-7",
              kind: "action",
              label: "7",
              text: "Auxiliary Hydraulic Pump — ON",
            },
            {
              id: "hyd-landing-8",
              kind: "action",
              label: "8",
              text: "Yaw Damper — OFF (prior to landing)",
            },
            {
              id: "hyd-landing-after",
              kind: "information",
              text: "After Touchdown:",
            },
            {
              id: "hyd-landing-9",
              kind: "condition",
              branches: [
                {
                  id: "hyd-landing-maintained",
                  label: "If hydraulic pressure is maintained",
                  steps: [
                    {
                      id: "hyd-landing-9a-maintained",
                      kind: "action",
                      label: "a",
                      text: "Spoilers — EXTEND",
                    },
                    {
                      id: "hyd-landing-9b-maintained",
                      kind: "action",
                      label: "b",
                      text: "Brakes — AS REQ’D",
                    },
                  ],
                },
                {
                  id: "hyd-landing-not-maintained",
                  label: "If hydraulic pressure is not maintained",
                  steps: [
                    {
                      id: "hyd-landing-9a-not-maintained",
                      kind: "action",
                      label: "a",
                      text: "Emergency Brake Handle — PUSH DOWNWARD",
                    },
                    {
                      id: "hyd-landing-9b-not-maintained",
                      kind: "action",
                      label: "b",
                      text: "Rudder and/or Nose Wheel Steering — AS REQ’D",
                    },
                  ],
                },
              ],
            },
            {
              id: "hyd-landing-recommendation",
              kind: "information",
              text: "Use of drag chute or thrust reversers (if installed) recommended.",
            },
          ],
        ),
      ],
    },
    {
      id: "jammed-stabilizer-landing",
      title: "JAMMED STABILIZER LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-30", "JAMMED STABILIZER LANDING")],
      stages: [
        allStage(
          "jammed-stabilizer-landing-a30",
          "JAMMED STABILIZER LANDING",
          "A-30",
          "JAMMED STABILIZER LANDING",
          [
            {
              id: "jammed-stab-intro",
              kind: "information",
              text: "Control pressure will be heavy. Copilot assistance with this procedure is recommended. Anticipate highest pull forces (approximately 75 pounds) at landing flare.",
            },
            {
              id: "jammed-stab-force",
              kind: "condition",
              branches: [
                {
                  id: "jammed-stab-pull",
                  label: "Elevator Pull Force",
                  steps: [
                    {
                      id: "jammed-stab-pull-1",
                      kind: "action",
                      label: "1",
                      text: "Move C.G. aft if possible. Transfer fuel to fuselage if possible.",
                    },
                    {
                      id: "jammed-stab-pull-2",
                      kind: "action",
                      label: "2",
                      text: "Land as soon as practical.",
                    },
                    {
                      id: "jammed-stab-pull-3",
                      kind: "action",
                      label: "3",
                      text: "Configuration — GEAR DN, FLAPS 20°",
                    },
                    {
                      id: "jammed-stab-pull-4",
                      kind: "action",
                      label: "4",
                      text: "Final Approach Speed — VREF + 20",
                    },
                    {
                      id: "jammed-stab-pull-5",
                      kind: "action",
                      label: "5",
                      text: "Yaw Damper — OFF (prior to landing)",
                    },
                    {
                      id: "jammed-stab-pull-6",
                      kind: "action",
                      label: "6",
                      text: "Landing Distance — MULTIPLY by 1.2",
                    },
                  ],
                },
                {
                  id: "jammed-stab-push",
                  label: "Elevator Push Force",
                  steps: [
                    {
                      id: "jammed-stab-push-1",
                      kind: "action",
                      label: "1",
                      text: "Move C.G. forward if possible. Transfer fuel to wing if possible.",
                    },
                    {
                      id: "jammed-stab-push-2",
                      kind: "action",
                      label: "2",
                      text: "Configuration — GEAR DN, FLAPS DN",
                    },
                    {
                      id: "jammed-stab-push-3",
                      kind: "action",
                      label: "3",
                      text: "Final Approach Speed — VREF",
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
      id: "one-or-both-spoilers-up-landing",
      title: "ONE OR BOTH SPOILERS UP LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-30", "ONE OR BOTH SPOILERS UP LANDING")],
      stages: [
        allStage(
          "spoilers-up-landing-a30",
          "ONE OR BOTH SPOILERS UP LANDING",
          "A-30",
          "ONE OR BOTH SPOILERS UP LANDING",
          [
            {
              id: "spoilers-up-1",
              kind: "action",
              label: "1",
              text: "Configuration — GEAR DN, FLAPS UP",
            },
            {
              id: "spoilers-up-2",
              kind: "action",
              label: "2",
              text: "Final Approach Speed — VREF + 40",
            },
            {
              id: "spoilers-up-3",
              kind: "action",
              label: "3",
              text: "Yaw Damper — OFF (prior to landing)",
            },
            {
              id: "spoilers-up-4",
              kind: "action",
              label: "4",
              text: "Landing Distance — MULTIPLY by 1.5",
            },
            {
              id: "spoilers-up-rec",
              kind: "information",
              text: "Use of drag chute or thrust reversers (if installed) recommended.",
            },
          ],
        ),
      ],
    },
    {
      id: "partial-flap-landing",
      title: "PARTIAL FLAP LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-31", "PARTIAL FLAP LANDING")],
      stages: [
        allStage(
          "partial-flap-landing-a31",
          "PARTIAL FLAP LANDING",
          "A-31",
          "PARTIAL FLAP LANDING",
          [
            {
              id: "partial-flap-1",
              kind: "action",
              label: "1",
              text: "Hydraulic Pressure — CHECK",
            },
            {
              id: "partial-flap-pressure",
              kind: "condition",
              branches: [
                {
                  id: "partial-flap-pressure-low",
                  label: "If pressure is low",
                  steps: [
                    {
                      id: "partial-flap-pressure-low-ref",
                      kind: "information",
                      text: "Refer to HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION procedure, Tab 11, this section and HYDRAULIC SYSTEM FAILURE LANDING procedure, Tab 13, this section.",
                    },
                  ],
                },
                {
                  id: "partial-flap-pressure-normal",
                  label: "If pressure is normal",
                  steps: [
                    {
                      id: "partial-flap-pressure-normal-next",
                      kind: "information",
                      text: "Go to step 2.",
                    },
                  ],
                },
              ],
            },
            {
              id: "partial-flap-2",
              kind: "action",
              label: "2",
              text: "Final Approach Configuration — GEAR DN",
            },
            {
              id: "partial-flap-3",
              kind: "action",
              label: "3",
              text: "Final Approach Speed — As APPROPRIATE for FLAP DEFLECTION",
            },
            {
              id: "partial-flap-3-note",
              kind: "information",
              text: "If actual flap deflection falls between those listed, use the final approach speed for the lesser flap deflection.",
            },
            {
              id: "partial-flap-4",
              kind: "action",
              label: "4",
              text: "Yaw Damper — OFF (prior to landing)",
            },
            {
              id: "partial-flap-5",
              kind: "action",
              label: "5",
              text: "Landing Distance — As APPROPRIATE for FLAP DEFLECTION",
            },
            {
              id: "partial-flap-table",
              kind: "information",
              text: "Flap Deflection UP: Final Approach Speed VREF + 30, Multiply Landing Distance By 1.35; 8°: VREF + 20, 1.30; 20°: VREF + 10, 1.20.",
            },
            {
              id: "partial-flap-rec",
              kind: "information",
              text: "Use of drag chute or thrust reversers (if installed) recommended.",
            },
          ],
        ),
      ],
    },
    {
      id: "single-engine-landing",
      title: "SINGLE-ENGINE LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-31", "SINGLE-ENGINE LANDING")],
      stages: [
        allStage(
          "single-engine-landing-a31",
          "SINGLE-ENGINE LANDING",
          "A-31",
          "SINGLE-ENGINE LANDING",
          [
            {
              id: "single-engine-landing-1",
              kind: "action",
              label: "1",
              text: "Final Landing Configuration — GEAR DN, FLAPS 20°",
            },
            {
              id: "single-engine-landing-2",
              kind: "action",
              label: "2",
              text: "Approach Speed — VREF + 10",
            },
            {
              id: "single-engine-landing-3",
              kind: "action",
              label: "3",
              text: "Yaw Damper — OFF (just prior to touchdown)",
            },
            {
              id: "single-engine-landing-4",
              kind: "action",
              label: "4",
              text: "Landing Distance — MULTIPLY by 1.2",
            },
          ],
        ),
      ],
    },
    {
      id: "stabilizer-heat-failure-landing",
      title: "STABILIZER HEAT FAILURE LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-32", "STABILIZER HEAT FAILURE LANDING")],
      stages: [
        allStage(
          "stabilizer-heat-landing-a32",
          "STABILIZER HEAT FAILURE LANDING",
          "A-32",
          "STABILIZER HEAT FAILURE LANDING",
          [
            {
              id: "stabilizer-heat-condition",
              kind: "condition",
              branches: [
                {
                  id: "stabilizer-heat-buffet",
                  label: "If buffet is encountered with full flaps",
                  steps: [
                    {
                      id: "stabilizer-heat-1",
                      kind: "action",
                      label: "1",
                      text: "Configuration — GEAR DN, FLAPS 20°",
                    },
                    {
                      id: "stabilizer-heat-2",
                      kind: "action",
                      label: "2",
                      text: "Final Approach Speed — VREF + 10",
                    },
                    {
                      id: "stabilizer-heat-3",
                      kind: "action",
                      label: "3",
                      text: "Yaw Damper — OFF (prior to landing)",
                    },
                    {
                      id: "stabilizer-heat-4",
                      kind: "action",
                      label: "4",
                      text: "Landing Distance — MULTIPLY by 1.1",
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
      id: "wing-heat-failure-landing",
      title: "WING HEAT FAILURE LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-32", "WING HEAT FAILURE LANDING")],
      stages: [
        allStage(
          "wing-heat-landing-a32",
          "WING HEAT FAILURE LANDING",
          "A-32",
          "WING HEAT FAILURE LANDING",
          [
            {
              id: "wing-heat-condition",
              kind: "information",
              text: "Landing with any ice on wing leading edge:",
            },
            {
              id: "wing-heat-1",
              kind: "action",
              label: "1",
              text: "Configuration — GEAR DN, FLAPS DN",
            },
            {
              id: "wing-heat-2",
              kind: "action",
              label: "2",
              text: "Final Approach Speed — VREF + 15",
            },
            {
              id: "wing-heat-3",
              kind: "action",
              label: "3",
              text: "Touchdown Speed — 15 knots above normal",
            },
            {
              id: "wing-heat-4",
              kind: "action",
              label: "4",
              text: "Landing Distance — MULTIPLY by 1.2",
            },
          ],
        ),
      ],
    },
    {
      id: "wing-and-stab-heat-failure-landing",
      title: "WING & STAB HEAT FAILURE LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-32", "WING & STAB HEAT FAILURE LANDING")],
      stages: [
        allStage(
          "wing-stab-heat-landing-a32",
          "WING & STAB HEAT FAILURE LANDING",
          "A-32",
          "WING & STAB HEAT FAILURE LANDING",
          [
            {
              id: "wing-stab-heat-condition",
              kind: "information",
              text: "Landing with wing and stabilizer ice:",
            },
            {
              id: "wing-stab-heat-1",
              kind: "action",
              label: "1",
              text: "Configuration — GEAR DN, FLAPS 20°",
            },
            {
              id: "wing-stab-heat-2",
              kind: "action",
              label: "2",
              text: "Final Approach Speed — VREF + 25",
            },
            {
              id: "wing-stab-heat-3",
              kind: "action",
              label: "3",
              text: "Yaw Damper — OFF (prior to landing)",
            },
            {
              id: "wing-stab-heat-4",
              kind: "action",
              label: "4",
              text: "Touchdown Speed — 25 knots above normal",
            },
            {
              id: "wing-stab-heat-5",
              kind: "action",
              label: "5",
              text: "Landing Distance — MULTIPLY by 1.3",
            },
          ],
        ),
      ],
    },
    {
      id: "one-thrust-reverser-deployed-landing",
      title: "ONE THRUST REVERSER DEPLOYED LANDING",
      procedureClass: "abnormal",
      category: "Landings",
      effectivity: {
        kind: "mapped",
        sourceText: "With TR-4000 Thrust Reversers",
        mappingNote:
          "The source procedure is selected only from explicit TR-4000 thrust-reverser configuration identity.",
      },
      applicability: tr4000,
      sources: [source("A-33.2", "ONE THRUST REVERSER DEPLOYED LANDING")],
      stages: [
        mappedStage(
          "one-tr-deployed-a33-2",
          "ONE THRUST REVERSER DEPLOYED LANDING",
          "A-33.2",
          "ONE THRUST REVERSER DEPLOYED LANDING",
          "With TR-4000 Thrust Reversers",
          tr4000,
          [
            {
              id: "one-tr-deployed-1",
              kind: "action",
              label: "1",
              text: "Final Landing Configuration — GEAR DN, FLAPS 20°",
            },
            {
              id: "one-tr-deployed-2",
              kind: "action",
              label: "2",
              text: "Final Approach Speed — VREF + 10",
            },
            {
              id: "one-tr-deployed-3",
              kind: "action",
              label: "3",
              text: "Reverser Control Switch (operating engine) — ARM",
            },
            {
              id: "one-tr-deployed-4",
              kind: "action",
              label: "4",
              text: "Yaw Damper — OFF (just prior to touchdown)",
            },
            {
              id: "one-tr-deployed-5",
              kind: "action",
              label: "5",
              text: "Landing Distance — MULTIPLY by 1.2",
            },
            {
              id: "one-tr-deployed-6",
              kind: "action",
              label: "6",
              text: "Spoilers — EXTEND (after touchdown)",
            },
            {
              id: "one-tr-deployed-7",
              kind: "action",
              label: "7",
              text: "Brakes — AS REQ’D",
            },
            {
              id: "one-tr-deployed-8",
              kind: "action",
              label: "8",
              text: "Reverser Lever (operating engine) — IDLE/DEPLOY",
            },
            {
              id: "one-tr-deployed-9",
              kind: "action",
              label: "9",
              text: "Reverse Thrust (operating engine) — AS DESIRED",
            },
            {
              id: "one-tr-deployed-10",
              kind: "action",
              label: "10",
              text: "Rudder, Brakes, Steering — AS REQ’D",
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
