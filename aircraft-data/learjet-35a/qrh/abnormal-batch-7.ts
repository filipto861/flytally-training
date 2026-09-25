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

export const learjet35aQrhHydraulicConfigurationKeys = {
  loHydLight: "lo-hyd-light",
} as const;

const loHydLightInstalled: AircraftApplicability = {
  configurationEquipmentAllOf: [
    learjet35aQrhHydraulicConfigurationKeys.loHydLight,
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
  effectivity: { kind: "mapped", sourceText: "ALL — IF INSTALLED" },
  applicability,
  sources: [source(pageLabel, section)],
  steps,
});

export const learjet35aQrhAbnormalBatch7ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3N Hydraulic Abnormal Procedures source batch.
 *
 * Covers the complete two-procedure Hydraulic index family on CL-102B A-23
 * and A-24. LO HYD LIGHT is explicitly equipment-qualified by the source and
 * therefore requires a declared configured-equipment installation. Visual
 * source review found no boxed memory items.
 */
export const learjet35aQrhAbnormalBatch7 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 7",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3N digitizes the complete Hydraulic abnormal family from CL-102B A-23/A-24. LO HYD LIGHT preserves the source IF INSTALLED qualifier through explicit configured-equipment applicability. Visual review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "lo-hyd-light",
      title: "LO HYD LIGHT (LOW HYDRAULIC PRESSURE)",
      procedureClass: "abnormal",
      category: "Hydraulic",
      effectivity: {
        kind: "mapped",
        sourceText: "ALL — IF INSTALLED",
        mappingNote:
          "Source applicability is equipment-qualified; explicit configured LO HYD light installation is required.",
      },
      applicability: loHydLightInstalled,
      sources: [
        source(
          "A-23",
          "LO HYD LIGHT (If Installed) (LOW HYDRAULIC PRESSURE)",
        ),
      ],
      stages: [
        mappedStage(
          "lo-hyd-light-a23",
          "LO HYD LIGHT (If Installed)",
          "A-23",
          "LO HYD LIGHT (If Installed) (LOW HYDRAULIC PRESSURE)",
          loHydLightInstalled,
          [
            {
              id: "lo-hyd-info",
              kind: "information",
              text: "If hydraulic pressure is not regained, landing gear, flaps, spoilers, brakes, and thrust reversers (if installed) may be affected. Landing distance with no flaps, no spoilers and no anti-skid will be greatly increased (for landing distance increase, refer to HYDRAULIC SYSTEM FAILURE LANDING procedure, Tab 13, this section).",
            },
            {
              id: "lo-hyd-1",
              kind: "action",
              label: "1",
              text: "Hydraulic Pressure — CHECK",
            },
            {
              id: "lo-hyd-pressure-result",
              kind: "condition",
              branches: [
                {
                  id: "lo-hyd-pressure-normal",
                  label: "2. If pressure is normal",
                  steps: [
                    {
                      id: "lo-hyd-pressure-normal-action",
                      kind: "action",
                      text: "Continue to monitor.",
                    },
                  ],
                },
                {
                  id: "lo-hyd-pressure-low",
                  label: "If pressure is low",
                  steps: [
                    {
                      id: "lo-hyd-pressure-low-reference",
                      kind: "action",
                      text: "Refer to HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION procedure, next page and HYDRAULIC SYSTEM FAILURE LANDING procedure, Tab 13, this section.",
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
      id: "hydraulic-system-failure-alternate-gear-extension",
      title: "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
      procedureClass: "abnormal",
      category: "Hydraulic",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [
        source(
          "A-24",
          "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
        ),
      ],
      stages: [
        allStage(
          "hydraulic-system-failure-a24",
          "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
          "A-24",
          "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
          [
            {
              id: "hydraulic-failure-1",
              kind: "action",
              label: "1",
              text: "Spoilers — RETRACT",
            },
            {
              id: "hydraulic-failure-on-approach",
              kind: "information",
              text: "On Approach:",
            },
            {
              id: "hydraulic-failure-2",
              kind: "action",
              label: "2",
              text: "Airspeed VLO or less (VREF + 30 recommended)",
            },
            {
              id: "hydraulic-failure-3",
              kind: "action",
              label: "3",
              text: "Landing Gear Switch — DN",
            },
            {
              id: "hydraulic-failure-4",
              kind: "action",
              label: "4",
              text: "GEAR CB (copilot’s ess bus) — PULL",
            },
            {
              id: "hydraulic-failure-5",
              kind: "action",
              label: "5",
              text: "SPOILERON CB (copilot’s AC bus) — PULL",
            },
            {
              id: "hydraulic-failure-6",
              kind: "action",
              label: "6",
              text: "Flap Switch — DN",
            },
            {
              id: "hydraulic-failure-7-info",
              kind: "information",
              label: "7",
              text: "To extend gear:",
            },
            {
              id: "hydraulic-failure-7a",
              kind: "action",
              label: "a",
              text: "Emergency Gear Extension Lever (Right Side Pedestal) — FULL DOWN",
            },
            {
              id: "hydraulic-failure-7b",
              kind: "action",
              label: "b",
              text: "Gear Lights — CHECK 3 GREEN, 2 RED",
            },
            {
              id: "hydraulic-failure-7c",
              kind: "action",
              label: "c",
              text: "After gear is down and locked, Emergency Gear Extension Lever — FULL UP",
            },
            {
              id: "hydraulic-failure-7c1",
              kind: "action",
              label: "(1)",
              text: "Lift ratchet release in hole forward of extension lever, right side of pedestal.",
            },
            {
              id: "hydraulic-failure-7c2",
              kind: "action",
              label: "(2)",
              text: "Pull extension lever up until it latches.",
            },
            {
              id: "hydraulic-failure-gear-result",
              kind: "condition",
              branches: [
                {
                  id: "hydraulic-failure-three-green",
                  label: "d. If all of the three green LOCKED DN lights are illuminated",
                  steps: [
                    {
                      id: "hydraulic-failure-three-green-reference",
                      kind: "action",
                      text: "Refer to HYDRAULIC SYSTEM FAILURE LANDING procedure, Tab 13, this section.",
                    },
                  ],
                },
                {
                  id: "hydraulic-failure-gear-not-down",
                  label: "If any gear is not down and locked",
                  steps: [
                    {
                      id: "hydraulic-failure-gear-not-down-reference",
                      kind: "action",
                      text: "Refer to GEAR UP LANDING procedure, Tab 12, this section.",
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
