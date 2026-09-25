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

const earlySerials: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 1, to: 106 },
    { prefix: "35-", from: 108, to: 112 },
    { prefix: "36-", from: 1, to: 31 },
  ],
};

const lateSerials: AircraftApplicability = {
  serialNumbers: ["35-107"],
  serialNumberRanges: [
    { prefix: "35-", from: 113 },
    { prefix: "36-", from: 32 },
  ],
};

const serialFamily: AircraftApplicability = {
  anyOf: [earlySerials, lateSerials],
};

export const learjet35aQrhAbnormalConfigurationKeys = {
  windshieldDefog: "windshield-defog",
} as const;

const windshieldDefogInstalled: AircraftApplicability = {
  ...lateSerials,
  configurationEquipmentAllOf: [
    learjet35aQrhAbnormalConfigurationKeys.windshieldDefog,
  ],
};

const allAircraftStage = (
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

const earlyEffectivity =
  "35-001 thru 35-106, 35-108 thru 35-112; and 36-001 thru 36-031";
const lateEffectivity = "35-107, 35-113 & on; and 36-032 & on";

export const learjet35aQrhAbnormalBatch1ReleaseStatus =
  "staged-source-review" as const;

/**
 * QRH.3H first Abnormal Procedures source batch.
 *
 * The complete Anti-Icing index family from A-4 through A-9/A-9.1 is
 * represented source-first. Serial page variants remain independent and the
 * optional WSHLD DEFOG procedure requires explicit equipment configuration.
 * Visual source review found no boxed memory items in this batch.
 */
export const learjet35aQrhAbnormalBatch1 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 1",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3H source digitization from CL-102B Abnormal Procedures A-i and A-4 through A-9/A-9.1. Page-level serial effectivity and optional windshield-defog installation are retained explicitly.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  sectionIntroductions: [
    {
      procedureClass: "abnormal",
      paragraphs: [
        "This section contains those operating procedures requiring the use of special systems and/or alternate use of regular systems which, if followed, will maintain an acceptable level of airworthiness or reduce operational risk resulting from a failure condition.",
        "The procedures located in this section supplement Normal Procedures when a failure condition exists. Use of Normal Procedures should be continued when applicable. Sound judgement as well as thorough knowledge of the aircraft, its characteristics, and the flight manual procedures are essential in the handling of any failure condition.",
        "In addition to the outlined items in the abnormal procedures, the following steps are considered part of all abnormal situations:",
        "Maintain Airplane Control",
        "Analyze the Situation",
        "Take Proper Action",
      ],
      sources: [source("A-i", "ABNORMAL PROCEDURES")],
    },
  ],
  scenarios: [
    {
      id: "alc-ai-light",
      title: "ALC AI LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-4", "ALC AI LIGHT")],
      stages: [
        allAircraftStage(
          "alc-ai-a4",
          "ALC AI LIGHT",
          "A-4",
          "ALC AI LIGHT",
          [
            { id: "alc-ai-1", kind: "action", label: "1", text: "When alcohol stops flowing, WSHLD/RADOME Switch — OFF" },
            { id: "alc-ai-2", kind: "action", label: "2", text: "After landing, assure alcohol reservoir is properly replenished." },
          ],
        ),
      ],
    },
    {
      id: "engine-ice-ingestion",
      title: "ENGINE ICE INGESTION",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-4", "ENGINE ICE INGESTION")],
      stages: [
        allAircraftStage(
          "engine-ice-ingestion-a4",
          "ENGINE ICE INGESTION",
          "A-4",
          "ENGINE ICE INGESTION",
          [
            { id: "engine-ice-ingestion-1", kind: "action", label: "1", text: "Ignition — BOTH ON" },
            { id: "engine-ice-ingestion-2", kind: "action", label: "2", text: "Thrust Lever Movement — SLOW & CAUTIOUS" },
            { id: "engine-ice-ingestion-3", kind: "action", label: "3", text: "Engine RPM — REDUCE" },
            { id: "engine-ice-ingestion-rpm-note", kind: "information", text: "Maintain Anti-ice and Pressurization RPM." },
            { id: "engine-ice-ingestion-4", kind: "action", label: "4", text: "Avoid abrupt change in pitch, roll or yaw." },
            { id: "engine-ice-ingestion-5", kind: "information", label: "5", text: "To determine extent of engine damage:" },
            { id: "engine-ice-ingestion-5a", kind: "action", label: "a", text: "Retard Thrust Levers (one at a time) to flight idle. Then cautiously advance and check for any vibration or abnormal noise on each engine." },
            {
              id: "engine-ice-ingestion-flameout",
              kind: "condition",
              branches: [{
                id: "engine-ice-ingestion-flameout-branch",
                label: "b. If either engine flames out",
                steps: [
                  { id: "engine-ice-ingestion-5b", kind: "action", text: "Perform an airstart procedure, Tab 5, Emergency Checklist. Stay below engine speed at which engine flamed out." },
                ],
              }],
            },
            {
              id: "engine-ice-ingestion-damage",
              kind: "condition",
              branches: [{
                id: "engine-ice-ingestion-damage-branch",
                label: "c. If ice damage has been experienced",
                steps: [
                  { id: "engine-ice-ingestion-5c", kind: "action", text: "Land as soon as practical and within limitations of operating capacity of engine. After landing, inspect engine for damage." },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "eng-ice-light",
      title: "ENG ICE LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-4", "ENG ICE LIGHT")],
      stages: [
        allAircraftStage(
          "eng-ice-light-a4",
          "Affected Engine",
          "A-4",
          "ENG ICE LIGHT",
          [
            { id: "eng-ice-light-1", kind: "action", label: "1", text: "NAC HT CB (main bus) — PULL/RESET" },
            {
              id: "eng-ice-light-remains",
              kind: "condition",
              branches: [{
                id: "eng-ice-light-remains-branch",
                label: "If light remains illuminated",
                steps: [{
                  id: "eng-ice-light-switch-state",
                  kind: "condition",
                  branches: [
                    {
                      id: "eng-ice-light-switch-off",
                      label: "2. If associated NAC HEAT switch is OFF",
                      steps: [
                        { id: "eng-ice-light-2-off", kind: "action", text: "Engine RPM — REDUCE" },
                      ],
                    },
                    {
                      id: "eng-ice-light-switch-on",
                      label: "If associated NAC HEAT switch is ON",
                      steps: [
                        { id: "eng-ice-light-2-on", kind: "action", text: "Engine RPM — INCREASE & FLY OUT OF ICING CONDITIONS IF POSSIBLE" },
                      ],
                    },
                  ],
                }],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "inadvertent-icing-encounter",
      title: "INADVERTENT ICING ENCOUNTER",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-5", "INADVERTENT ICING ENCOUNTER")],
      stages: [
        allAircraftStage(
          "inadvertent-icing-a5",
          "INADVERTENT ICING ENCOUNTER",
          "A-5",
          "INADVERTENT ICING ENCOUNTER",
          [
            {
              id: "inadvertent-icing-encountered",
              kind: "condition",
              branches: [{
                id: "inadvertent-icing-encountered-branch",
                label: "If icing is inadvertently encountered",
                steps: [
                  { id: "inadvertent-icing-1", kind: "action", label: "1", text: "Anti-Ice Systems — ACTIVATE" },
                  {
                    id: "inadvertent-icing-landing",
                    kind: "condition",
                    branches: [{
                      id: "inadvertent-icing-landing-branch",
                      label: "If approach and landing must be made with any amount of ice on the airframe",
                      steps: [
                        { id: "inadvertent-icing-landing-a", kind: "action", label: "a", text: "Do not extend flaps beyond 20°." },
                        { id: "inadvertent-icing-landing-b", kind: "action", label: "b", text: "Refer to WING & STAB HEAT FAILURE LANDING procedure, Tab 15, this section." },
                      ],
                    }],
                  },
                ],
              }],
            },
            {
              id: "inadvertent-icing-heavy",
              kind: "condition",
              branches: [
                {
                  id: "inadvertent-icing-heavy-landing",
                  label: "If heavy ice accumulation has occurred — If landing with ice on the wings and stabilizer",
                  steps: [
                    { id: "inadvertent-icing-heavy-landing-1", kind: "action", label: "1", text: "Refer to WING & STAB HEAT FAILURE LANDING procedure, Tab 15, this section." },
                  ],
                },
                {
                  id: "inadvertent-icing-heavy-remove",
                  label: "If heavy ice accumulation has occurred — If attempting to remove ice accumulation",
                  steps: [
                    { id: "inadvertent-icing-heavy-remove-1", kind: "action", label: "1", text: "Ignition — BOTH ON" },
                    { id: "inadvertent-icing-heavy-remove-2", kind: "action", label: "2", text: "Engine RPM — REDUCE" },
                    { id: "inadvertent-icing-heavy-remove-3a", kind: "action", label: "3", text: "Nacelle Heat (one engine) — ON" },
                    { id: "inadvertent-icing-heavy-remove-wait", kind: "information", text: "Wait for satisfactory engine operation, then:" },
                    { id: "inadvertent-icing-heavy-remove-3b", kind: "action", text: "Nacelle Heat (other engine) — ON" },
                    { id: "inadvertent-icing-heavy-remove-4", kind: "action", label: "4", text: "Stabilizer/Wing Heat — ON" },
                    { id: "inadvertent-icing-heavy-remove-5", kind: "action", label: "5", text: "Windshield Heat — AS REQ’D" },
                  ],
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      id: "pitot-ht-light",
      title: "PITOT HT LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-5", "PITOT HT LIGHT")],
      stages: [
        allAircraftStage(
          "pitot-ht-a5",
          "PITOT HT LIGHT",
          "A-5",
          "PITOT HT LIGHT",
          [
            { id: "pitot-ht-1", kind: "action", label: "1", text: "PITOT HEAT Switches — ON" },
            { id: "pitot-ht-2", kind: "action", label: "2", text: "L & R PITOT HT CBs (ess buses) — CHECK" },
            { id: "pitot-ht-3", kind: "action", label: "3", text: "Pitot-Static Systems — CROSS-CHECK" },
          ],
        ),
      ],
    },
    {
      id: "stabilizer-heat-failure",
      title: "STABILIZER HEAT FAILURE",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-6/A-6.1 serial-number effectivity",
        mappingNote: "The applicable page is selected from exact aircraft serial number.",
      },
      applicability: serialFamily,
      sources: [
        source("A-6", "STABILIZER HEAT FAILURE"),
        source("A-6.1", "STABILIZER HEAT FAILURE"),
      ],
      stages: [
        mappedStage(
          "stabilizer-heat-a6",
          "A-6 source variant",
          "A-6",
          "STABILIZER HEAT FAILURE",
          earlyEffectivity,
          earlySerials,
          [
            { id: "stabilizer-heat-a6-1", kind: "action", label: "1", text: "STAB & WING HT CB (copilot’s main bus) — CHECK & RESET" },
            { id: "stabilizer-heat-a6-2", kind: "action", label: "2", text: "Engine RPM — ADJUST AS REQ’D" },
            {
              id: "stabilizer-heat-a6-red",
              kind: "condition",
              branches: [{
                id: "stabilizer-heat-a6-red-branch",
                label: "3. If STAB TEMP Indicator remains in the red range",
                steps: [
                  { id: "stabilizer-heat-a6-3a", kind: "action", label: "a", text: "Fly out of icing conditions, if possible." },
                  { id: "stabilizer-heat-a6-3b", kind: "action", label: "b", text: "Do not extend flaps beyond 20°." },
                ],
              }],
            },
            {
              id: "stabilizer-heat-a6-cabin-alt",
              kind: "condition",
              branches: [{
                id: "stabilizer-heat-a6-cabin-alt-branch",
                label: "4. If cabin altitude climbs to an unacceptable level",
                steps: [
                  { id: "stabilizer-heat-a6-4a", kind: "action", label: "a", text: "CABIN AIR Switch — MAX" },
                  { id: "stabilizer-heat-a6-4b", kind: "action", label: "b", text: "Descend to an acceptable level." },
                ],
              }],
            },
            { id: "stabilizer-heat-a6-ref", kind: "action", text: "Refer to STABILIZER HEAT FAILURE LANDING procedure, Tab 15, this section." },
          ],
        ),
        mappedStage(
          "stabilizer-heat-a6-1",
          "A-6.1 source variant",
          "A-6.1",
          "STABILIZER HEAT FAILURE",
          lateEffectivity,
          lateSerials,
          [
            { id: "stabilizer-heat-a61-1", kind: "action", label: "1", text: "STAB & WING HT CB (copilot’s main bus) — CHECK & RESET" },
            { id: "stabilizer-heat-a61-2", kind: "action", label: "2", text: "Engine RPM — ADJUST AS REQ’D" },
            {
              id: "stabilizer-heat-a61-red",
              kind: "condition",
              branches: [{
                id: "stabilizer-heat-a61-red-branch",
                label: "3. If STAB TEMP Indicator remains in the red range",
                steps: [
                  { id: "stabilizer-heat-a61-3a", kind: "action", label: "a", text: "Fly out of icing conditions, if possible." },
                  { id: "stabilizer-heat-a61-3b", kind: "action", label: "b", text: "Do not extend flaps beyond 20°." },
                ],
              }],
            },
            { id: "stabilizer-heat-a61-ref", kind: "action", text: "Refer to STABILIZER HEAT FAILURE LANDING procedure, Tab 15, this section." },
          ],
        ),
      ],
    },
    {
      id: "stab-ov-ht-light",
      title: "STAB OV HT LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-6/A-6.1 serial-number effectivity",
        mappingNote: "Text is repeated on both source page variants; page provenance still follows aircraft serial effectivity.",
      },
      applicability: serialFamily,
      sources: [
        source("A-6", "STAB OV HT LIGHT"),
        source("A-6.1", "STAB OV HT LIGHT"),
      ],
      stages: [
        mappedStage(
          "stab-ov-ht-a6",
          "A-6 source variant",
          "A-6",
          "STAB OV HT LIGHT",
          earlyEffectivity,
          earlySerials,
          [
            { id: "stab-ov-ht-a6-1", kind: "action", label: "1", text: "Stabilizer Temperature — CHECK" },
            {
              id: "stab-ov-ht-a6-overheat",
              kind: "condition",
              branches: [{
                id: "stab-ov-ht-a6-overheat-branch",
                label: "2. If stabilizer overheat condition exists",
                steps: [
                  { id: "stab-ov-ht-a6-2a", kind: "action", label: "a", text: "Engine RPM — REDUCE" },
                  {
                    id: "stab-ov-ht-a6-remains",
                    kind: "condition",
                    branches: [{
                      id: "stab-ov-ht-a6-remains-branch",
                      label: "b. If overheat condition remains",
                      steps: [
                        { id: "stab-ov-ht-a6-2b1", kind: "action", label: "(1)", text: "STAB WING HEAT Switch — OFF" },
                        { id: "stab-ov-ht-a6-2b2", kind: "action", label: "(2)", text: "Fly out of icing conditions." },
                      ],
                    }],
                  },
                ],
              }],
            },
            { id: "stab-ov-ht-a6-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
        mappedStage(
          "stab-ov-ht-a6-1",
          "A-6.1 source variant",
          "A-6.1",
          "STAB OV HT LIGHT",
          lateEffectivity,
          lateSerials,
          [
            { id: "stab-ov-ht-a61-1", kind: "action", label: "1", text: "Stabilizer Temperature — CHECK" },
            {
              id: "stab-ov-ht-a61-overheat",
              kind: "condition",
              branches: [{
                id: "stab-ov-ht-a61-overheat-branch",
                label: "2. If stabilizer overheat condition exists",
                steps: [
                  { id: "stab-ov-ht-a61-2a", kind: "action", label: "a", text: "Engine RPM — REDUCE" },
                  {
                    id: "stab-ov-ht-a61-remains",
                    kind: "condition",
                    branches: [{
                      id: "stab-ov-ht-a61-remains-branch",
                      label: "b. If overheat condition remains",
                      steps: [
                        { id: "stab-ov-ht-a61-2b1", kind: "action", label: "(1)", text: "STAB WING HEAT Switch — OFF" },
                        { id: "stab-ov-ht-a61-2b2", kind: "action", label: "(2)", text: "Fly out of icing conditions." },
                      ],
                    }],
                  },
                ],
              }],
            },
            { id: "stab-ov-ht-a61-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
      ],
    },
    {
      id: "wing-heat-failure",
      title: "WING HEAT FAILURE",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-7/A-7.1 serial-number effectivity",
        mappingNote: "The applicable page is selected from exact aircraft serial number.",
      },
      applicability: serialFamily,
      sources: [
        source("A-7", "WING HEAT FAILURE"),
        source("A-7.1", "WING HEAT FAILURE"),
      ],
      stages: [
        mappedStage(
          "wing-heat-a7",
          "A-7 source variant",
          "A-7",
          "WING HEAT FAILURE",
          earlyEffectivity,
          earlySerials,
          [
            { id: "wing-heat-a7-1", kind: "action", label: "1", text: "STAB & WING HT CB (copilot’s main bus) — CHECK & RESET" },
            { id: "wing-heat-a7-2", kind: "action", label: "2", text: "Engine RPM — ADJUST AS REQ’D" },
            {
              id: "wing-heat-a7-ice-remains",
              kind: "condition",
              branches: [{
                id: "wing-heat-a7-ice-remains-branch",
                label: "3. If WING TEMP indicator remains in the red range and/or visual indications of ice accumulation remain",
                steps: [
                  { id: "wing-heat-a7-3", kind: "action", text: "Fly out of icing conditions." },
                ],
              }],
            },
            {
              id: "wing-heat-a7-cabin-alt",
              kind: "condition",
              branches: [{
                id: "wing-heat-a7-cabin-alt-branch",
                label: "4. If cabin altitude climbs to an unacceptable level",
                steps: [
                  { id: "wing-heat-a7-4a", kind: "action", label: "a", text: "CABIN AIR Switch — MAX" },
                  { id: "wing-heat-a7-4b", kind: "action", label: "b", text: "Descend to an acceptable level." },
                ],
              }],
            },
            { id: "wing-heat-a7-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
        mappedStage(
          "wing-heat-a7-1",
          "A-7.1 source variant",
          "A-7.1",
          "WING HEAT FAILURE",
          lateEffectivity,
          lateSerials,
          [
            { id: "wing-heat-a71-1", kind: "action", label: "1", text: "STAB & WING HT CB (copilot’s main bus) — CHECK & RESET" },
            { id: "wing-heat-a71-2", kind: "action", label: "2", text: "Engine RPM — ADJUST AS REQ’D" },
            {
              id: "wing-heat-a71-ice-remains",
              kind: "condition",
              branches: [{
                id: "wing-heat-a71-ice-remains-branch",
                label: "3. If WING TEMP indicator remains in the red range and/or visual indications of ice accumulation remain",
                steps: [
                  { id: "wing-heat-a71-3", kind: "action", text: "Fly out of icing conditions." },
                ],
              }],
            },
            { id: "wing-heat-a71-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
      ],
    },
    {
      id: "wing-ov-ht-light",
      title: "WING OV HT LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-7/A-7.1 serial-number effectivity",
        mappingNote: "Text is repeated on both source page variants; page provenance still follows aircraft serial effectivity.",
      },
      applicability: serialFamily,
      sources: [
        source("A-7", "WING OV HT LIGHT"),
        source("A-7.1", "WING OV HT LIGHT"),
      ],
      stages: [
        mappedStage(
          "wing-ov-ht-a7",
          "A-7 source variant",
          "A-7",
          "WING OV HT LIGHT",
          earlyEffectivity,
          earlySerials,
          [
            { id: "wing-ov-ht-a7-1", kind: "action", label: "1", text: "Wing Temperature — CHECK" },
            {
              id: "wing-ov-ht-a7-overheat",
              kind: "condition",
              branches: [{
                id: "wing-ov-ht-a7-overheat-branch",
                label: "2. If wing overheat condition exists",
                steps: [
                  { id: "wing-ov-ht-a7-2a", kind: "action", label: "a", text: "Engine RPM — REDUCE" },
                  {
                    id: "wing-ov-ht-a7-remains",
                    kind: "condition",
                    branches: [{
                      id: "wing-ov-ht-a7-remains-branch",
                      label: "b. If overheat condition remains",
                      steps: [
                        { id: "wing-ov-ht-a7-2b1", kind: "action", label: "(1)", text: "STAB WING HEAT Switch — OFF" },
                        { id: "wing-ov-ht-a7-2b2", kind: "action", label: "(2)", text: "Fly out of icing conditions." },
                      ],
                    }],
                  },
                ],
              }],
            },
            { id: "wing-ov-ht-a7-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
        mappedStage(
          "wing-ov-ht-a7-1",
          "A-7.1 source variant",
          "A-7.1",
          "WING OV HT LIGHT",
          lateEffectivity,
          lateSerials,
          [
            { id: "wing-ov-ht-a71-1", kind: "action", label: "1", text: "Wing Temperature — CHECK" },
            {
              id: "wing-ov-ht-a71-overheat",
              kind: "condition",
              branches: [{
                id: "wing-ov-ht-a71-overheat-branch",
                label: "2. If wing overheat condition exists",
                steps: [
                  { id: "wing-ov-ht-a71-2a", kind: "action", label: "a", text: "Engine RPM — REDUCE" },
                  {
                    id: "wing-ov-ht-a71-remains",
                    kind: "condition",
                    branches: [{
                      id: "wing-ov-ht-a71-remains-branch",
                      label: "b. If overheat condition remains",
                      steps: [
                        { id: "wing-ov-ht-a71-2b1", kind: "action", label: "(1)", text: "STAB WING HEAT Switch — OFF" },
                        { id: "wing-ov-ht-a71-2b2", kind: "action", label: "(2)", text: "Fly out of icing conditions." },
                      ],
                    }],
                  },
                ],
              }],
            },
            { id: "wing-ov-ht-a71-ref", kind: "action", text: "Refer to WING HEAT FAILURE LANDING procedure, Tab 15, this section, if landing must be made with ice or suspected ice on the wings." },
          ],
        ),
      ],
    },
    {
      id: "windshield-heat-failure",
      title: "WINDSHIELD HEAT FAILURE",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-8/A-8.1 serial-number effectivity",
        mappingNote: "The applicable page is selected from exact aircraft serial number.",
      },
      applicability: serialFamily,
      sources: [
        source("A-8", "WINDSHIELD HEAT FAILURE"),
        source("A-8.1", "WINDSHIELD HEAT FAILURE"),
      ],
      stages: [
        mappedStage(
          "windshield-heat-a8",
          "A-8 source variant",
          "A-8",
          "WINDSHIELD HEAT FAILURE",
          earlyEffectivity,
          earlySerials,
          [
            { id: "windshield-heat-a8-1", kind: "action", label: "1", text: "WSHLD HT CB (pilot’s main bus) — CHECK & RESET" },
            { id: "windshield-heat-a8-2", kind: "action", label: "2", text: "Windshield Heat — AUTO" },
            { id: "windshield-heat-a8-3", kind: "action", label: "3", text: "Engine RPM — INCREASE AS REQ’D" },
            {
              id: "windshield-heat-a8-cabin-alt",
              kind: "condition",
              branches: [{
                id: "windshield-heat-a8-cabin-alt-branch",
                label: "4. If cabin altitude climbs to an unacceptable level",
                steps: [
                  { id: "windshield-heat-a8-4a", kind: "action", label: "a", text: "CABIN AIR Switch — MAX" },
                  { id: "windshield-heat-a8-4b", kind: "action", label: "b", text: "Descend to an acceptable level." },
                ],
              }],
            },
            {
              id: "windshield-heat-a8-fails",
              kind: "condition",
              branches: [{
                id: "windshield-heat-a8-fails-branch",
                label: "If system fails to anti-ice the windshield",
                steps: [
                  { id: "windshield-heat-a8-5", kind: "action", label: "5", text: "Windshield & Radome Alcohol — ON, IF REQ’D" },
                  { id: "windshield-heat-a8-6", kind: "action", label: "6", text: "Windshield & Radome Alcohol — OFF (when depleted or out of icing conditions)" },
                ],
              }],
            },
          ],
        ),
        mappedStage(
          "windshield-heat-a8-1",
          "A-8.1 source variant",
          "A-8.1",
          "WINDSHIELD HEAT FAILURE",
          lateEffectivity,
          lateSerials,
          [
            { id: "windshield-heat-a81-1", kind: "action", label: "1", text: "WSHLD HT CB (pilot’s main bus) — CHECK & RESET" },
            { id: "windshield-heat-a81-2", kind: "action", label: "2", text: "Windshield Heat — ON" },
            { id: "windshield-heat-a81-3", kind: "action", label: "3", text: "Engine RPM — INCREASE AS REQ’D" },
            {
              id: "windshield-heat-a81-fails",
              kind: "condition",
              branches: [{
                id: "windshield-heat-a81-fails-branch",
                label: "If system fails to anti-ice the windshield",
                steps: [
                  { id: "windshield-heat-a81-4", kind: "action", label: "4", text: "Windshield & Radome Alcohol — ON, IF REQ’D" },
                  { id: "windshield-heat-a81-5", kind: "action", label: "5", text: "Windshield & Radome Alcohol — OFF (when depleted or out of icing conditions)" },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "wshld-defog-light",
      title: "WSHLD DEFOG LIGHT (IF INSTALLED)",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-8.1; 35-107, 35-113 & on; and 36-032 & on; IF INSTALLED",
        mappingNote: "The procedure requires both the late-serial source page and explicit installed windshield-defog equipment.",
      },
      applicability: windshieldDefogInstalled,
      sources: [source("A-8.1", "WSHLD DEFOG LIGHT (IF INSTALLED)")],
      stages: [
        mappedStage(
          "wshld-defog-a8-1",
          "A-8.1 installed-system procedure",
          "A-8.1",
          "WSHLD DEFOG LIGHT (IF INSTALLED)",
          "35-107, 35-113 & on; and 36-032 & on; IF INSTALLED",
          windshieldDefogInstalled,
          [
            {
              id: "wshld-defog-persists",
              kind: "condition",
              branches: [{
                id: "wshld-defog-persists-branch",
                label: "If windshield overheat condition persists for more than 10 minutes, deactivate affected windshield",
                steps: [
                  { id: "wshld-defog-1", kind: "action", label: "1", text: "L or R WSHLD DEFOG CB (ess B bus) — PULL" },
                  { id: "wshld-defog-2", kind: "action", label: "2", text: "Affected Windshield — CHECK" },
                ],
              }],
            },
            {
              id: "wshld-defog-descent",
              kind: "condition",
              branches: [{
                id: "wshld-defog-descent-branch",
                label: "If descending with an inoperative defog system into conditions requiring defogging",
                steps: [
                  { id: "wshld-defog-descent-1", kind: "action", label: "1", text: "Windshield Heat — ON" },
                  { id: "wshld-defog-descent-2", kind: "action", label: "2", text: "Cockpit Shoulder & Ankle Eyeball Outlets — CLOSE" },
                  { id: "wshld-defog-descent-3", kind: "action", label: "3", text: "AUX HT — CREW" },
                  {
                    id: "wshld-defog-fl350",
                    kind: "condition",
                    branches: [{
                      id: "wshld-defog-fl350-branch",
                      label: "4. At FL 350",
                      steps: [
                        { id: "wshld-defog-4a", kind: "action", label: "a", text: "COOL–FAN Switch — COOL" },
                        { id: "wshld-defog-4b", kind: "action", label: "b", text: "AUTO–MAN Switch — MAN" },
                        { id: "wshld-defog-4c", kind: "action", label: "c", text: "COLD–HOT Knob — AS REQ’D" },
                      ],
                    }],
                  },
                  { id: "wshld-defog-5", kind: "action", label: "5", text: "Leave cabin air and windshield heat on until shutdown." },
                ],
              }],
            },
          ],
        ),
      ],
    },
    {
      id: "wshld-ov-ht-light",
      title: "WSHLD OV HT LIGHT",
      procedureClass: "abnormal",
      category: "Anti-Icing",
      effectivity: {
        kind: "mapped",
        sourceText: "A-9/A-9.1 serial-number effectivity",
        mappingNote: "The applicable source response changes materially across the serial split.",
      },
      applicability: serialFamily,
      sources: [
        source("A-9", "WSHLD OV HT LIGHT"),
        source("A-9.1", "WSHLD OV HT LIGHT"),
      ],
      stages: [
        mappedStage(
          "wshld-ov-ht-a9",
          "A-9 source variant",
          "A-9",
          "WSHLD OV HT LIGHT",
          earlyEffectivity,
          earlySerials,
          [
            {
              id: "wshld-ov-ht-a9-airflow",
              kind: "condition",
              branches: [{
                id: "wshld-ov-ht-a9-airflow-branch",
                label: "If airflow did not shut off when WSHLD OV HT light illuminated",
                steps: [
                  { id: "wshld-ov-ht-a9-1", kind: "action", label: "1", text: "Windshield Heat — MAN" },
                  { id: "wshld-ov-ht-a9-2", kind: "action", label: "2", text: "WSHLD HEAT ON-OFF Switch — OFF, until airflow stops" },
                ],
              }],
            },
            {
              id: "wshld-ov-ht-a9-remains",
              kind: "condition",
              branches: [{
                id: "wshld-ov-ht-a9-remains-branch",
                label: "If WSHLD OV HT light remains on",
                steps: [
                  { id: "wshld-ov-ht-a9-3a", kind: "action", label: "3", text: "Engine RPM — REDUCE" },
                  { id: "wshld-ov-ht-a9-and-or", kind: "information", text: "and/or" },
                  { id: "wshld-ov-ht-a9-3b", kind: "action", text: "IN NORMAL/OUT DEFOG Knob — PUSH IN" },
                ],
              }],
            },
          ],
        ),
        mappedStage(
          "wshld-ov-ht-a9-1",
          "A-9.1 source variant",
          "A-9.1",
          "WSHLD OV HT LIGHT",
          lateEffectivity,
          lateSerials,
          [
            {
              id: "wshld-ov-ht-a91-airflow",
              kind: "condition",
              branches: [{
                id: "wshld-ov-ht-a91-airflow-branch",
                label: "If airflow did not shut off when WSHLD OV HT light illuminated",
                steps: [
                  { id: "wshld-ov-ht-a91-1", kind: "action", label: "1", text: "Windshield Heat — OFF" },
                ],
              }],
            },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
