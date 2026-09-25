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

export const learjet35aQrhAbnormalBatch9ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3P Landing Gear Abnormal Procedures source batch.
 *
 * Covers the complete three-procedure Landing Gear index family on CL-102B
 * A-26/A-27. All three source procedures carry ALL effectivity. Visual source
 * review found no boxed memory items.
 */
export const learjet35aQrhAbnormalBatch9 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 9",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3P digitizes the complete Landing Gear abnormal family from CL-102B A-26/A-27. All three procedures are ALL-aircraft. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "alternate-gear-extension-electrical-malfunction",
      title: "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
      procedureClass: "abnormal",
      category: "Landing Gear",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [
        source(
          "A-26",
          "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
        ),
      ],
      stages: [
        allStage(
          "alternate-gear-electrical-a26",
          "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
          "A-26",
          "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
          [
            {
              id: "alternate-gear-electrical-1",
              kind: "action",
              label: "1",
              text: "Airspeed VLO or less.",
            },
            {
              id: "alternate-gear-electrical-2",
              kind: "action",
              label: "2",
              text: "Landing Gear Switch — DN",
            },
            {
              id: "alternate-gear-electrical-3",
              kind: "action",
              label: "3",
              text: "GEAR CB (copilot’s ess bus) — PULL",
            },
            {
              id: "alternate-gear-electrical-4-info",
              kind: "information",
              label: "4",
              text: "To extend gear:",
            },
            {
              id: "alternate-gear-electrical-4a",
              kind: "action",
              label: "a",
              text: "Emergency Gear Lever (right side pedestal) — FULL DOWN",
            },
            {
              id: "alternate-gear-electrical-4b",
              kind: "action",
              label: "b",
              text: "Gear Lights — CHECK 3 GREEN, 2 RED",
            },
            {
              id: "alternate-gear-electrical-4c",
              kind: "information",
              label: "c",
              text: "If any gear is not down and locked, refer to GEAR UP LANDING procedure, next page.",
            },
          ],
        ),
      ],
    },
    {
      id: "anti-skid-gen-light-anti-skid-off-operation",
      title: "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
      procedureClass: "abnormal",
      category: "Landing Gear",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [
        source(
          "A-27",
          "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
        ),
      ],
      stages: [
        allStage(
          "anti-skid-gen-a27",
          "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
          "A-27",
          "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
          [
            {
              id: "anti-skid-gen-1",
              kind: "action",
              label: "1",
              text: "Anti-Skid Switch — OFF, then ON",
            },
            {
              id: "anti-skid-gen-remains",
              kind: "condition",
              branches: [
                {
                  id: "anti-skid-gen-remains-illuminated",
                  label: "If any ANTI-SKID GEN light(s) remain illuminated",
                  steps: [
                    {
                      id: "anti-skid-gen-2",
                      kind: "action",
                      label: "2",
                      text: "Anti-Skid Switch — OFF",
                    },
                    {
                      id: "anti-skid-gen-afm",
                      kind: "information",
                      text: "Refer to AFM, Section V for increased stopping distances for takeoff and landing.",
                    },
                    {
                      id: "anti-skid-gen-3",
                      kind: "action",
                      label: "3",
                      text: "Brakes — CAUTIOUSLY APPLY, AS REQ’D",
                    },
                    {
                      id: "anti-skid-gen-4",
                      kind: "information",
                      label: "4",
                      text: "Be prepared to use EMERGENCY BRAKING procedure, Tab 14, Emergency Checklist.",
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
      id: "nose-wheel-steering-malfunction",
      title: "NOSE WHEEL STEERING MALFUNCTION",
      procedureClass: "abnormal",
      category: "Landing Gear",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-27", "NOSE WHEEL STEERING MALFUNCTION")],
      stages: [
        allStage(
          "nose-wheel-steering-a27",
          "NOSE WHEEL STEERING MALFUNCTION",
          "A-27",
          "NOSE WHEEL STEERING MALFUNCTION",
          [
            {
              id: "nose-wheel-steering-context",
              kind: "condition",
              branches: [
                {
                  id: "nose-wheel-steering-taxi",
                  label: "At Normal Taxi Speed",
                  steps: [
                    {
                      id: "nose-wheel-steering-taxi-1",
                      kind: "action",
                      label: "1",
                      text: "Nose Wheel Steering — DISENGAGE (USE MSW)",
                    },
                    {
                      id: "nose-wheel-steering-taxi-2",
                      kind: "action",
                      label: "2",
                      text: "Thrust Levers — IDLE",
                    },
                    {
                      id: "nose-wheel-steering-taxi-3",
                      kind: "action",
                      label: "3",
                      text: "Brake to a stop.",
                    },
                    {
                      id: "nose-wheel-steering-taxi-4",
                      kind: "action",
                      label: "4",
                      text: "Taxi using differential braking and thrust.",
                    },
                  ],
                },
                {
                  id: "nose-wheel-steering-takeoff",
                  label: "During Takeoff",
                  steps: [
                    {
                      id: "nose-wheel-steering-takeoff-1",
                      kind: "action",
                      label: "1",
                      text: "Nose Wheel Steering — DISENGAGE (USE MSW)",
                    },
                    {
                      id: "nose-wheel-steering-takeoff-2",
                      kind: "action",
                      label: "2",
                      text: "Continue takeoff using rudder and/or brakes for directional control.",
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
