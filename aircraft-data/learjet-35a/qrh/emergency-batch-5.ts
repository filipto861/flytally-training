import type {
  AircraftAbnormalEmergencyV2Content,
  AircraftQrhStage,
} from "../../../lib/universal-abnormal-emergency.ts";
import type { AircraftApplicability } from "../../../lib/universal-aircraft-content.ts";
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

const source = (pageLabel: string, section: string) => ({
  manualId: learjet35aChecklistSourceManifest.manualId,
  chapter: "Emergency Procedures",
  section,
  pageLabel,
});

const earlyBleedSerials: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 1, to: 81 },
    { prefix: "35-", from: 83, to: 86 },
    { prefix: "36-", from: 1, to: 22 },
  ],
};

const directBleedEnhancedSerials: AircraftApplicability = {
  serialNumbers: ["35-082"],
  serialNumberRanges: [
    { prefix: "35-", from: 87, to: 106 },
    { prefix: "35-", from: 108, to: 112 },
    { prefix: "36-", from: 23, to: 31 },
  ],
};

const lateBleedSerials: AircraftApplicability = {
  serialNumbers: ["35-107"],
  serialNumberRanges: [
    { prefix: "35-", from: 113 },
    { prefix: "36-", from: 32 },
  ],
};

const fireFirstPageEarly: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 1, to: 106 },
    { prefix: "35-", from: 108, to: 112 },
    { prefix: "36-", from: 1, to: 31 },
  ],
};

const fireFirstPageLate: AircraftApplicability = {
  serialNumbers: ["35-107"],
  serialNumberRanges: [
    { prefix: "35-", from: 113 },
    { prefix: "36-", from: 32 },
  ],
};

const fireElectricalPriorSerials: AircraftApplicability = {
  serialNumbers: ["35-205"],
  serialNumberRanges: [
    { prefix: "35-", from: 1, to: 201 },
    { prefix: "36-", from: 1, to: 40 },
  ],
};

const fireElectricalLateSerials: AircraftApplicability = {
  serialNumberRanges: [
    { prefix: "35-", from: 202, to: 204 },
    { prefix: "35-", from: 206 },
    { prefix: "36-", from: 41 },
  ],
};

const bleedFamilyApplicability: AircraftApplicability = {
  anyOf: [
    { serialNumberRanges: [{ prefix: "35-", from: 1 }] },
    { serialNumberRanges: [{ prefix: "36-", from: 1 }] },
  ],
};

const bleedE20Applicability: AircraftApplicability = {
  ...earlyBleedSerials,
  modificationsNoneOf: ["amk-76-7"],
};

const bleedE201Applicability: AircraftApplicability = {
  anyOf: [
    directBleedEnhancedSerials,
    {
      ...earlyBleedSerials,
      modificationsAllOf: ["amk-76-7"],
    },
  ],
};

const fireScenarioApplicability: AircraftApplicability = {
  anyOf: [
    fireElectricalLateSerials,
    {
      ...fireElectricalPriorSerials,
      modificationsAllOf: ["amk-78-13"],
    },
    {
      ...fireElectricalPriorSerials,
      modificationsNoneOf: ["amk-78-13"],
    },
  ],
};

const fireE23Applicability: AircraftApplicability = {
  ...fireElectricalPriorSerials,
  modificationsNoneOf: ["amk-78-13"],
};

const fireE231Applicability: AircraftApplicability = {
  anyOf: [
    fireElectricalLateSerials,
    {
      ...fireElectricalPriorSerials,
      modificationsAllOf: ["amk-78-13"],
    },
  ],
};

const fireInitialSteps = (bleedResponse: string) => [
  { id: `${bleedResponse}-fire-1`, kind: "action", label: "1", text: "Crew Oxygen Masks — DON & SELECT 100%", memoryItem: true },
  { id: `${bleedResponse}-fire-2`, kind: "action", label: "2", text: "Smoke Goggles — DON, IF AVAILABLE", memoryItem: true },
  { id: `${bleedResponse}-fire-3`, kind: "action", label: "3", text: "OXY-MIC Switches — ON", memoryItem: true },
  {
    id: `${bleedResponse}-fire-visible-check`,
    kind: "condition",
    branches: [{
      id: `${bleedResponse}-fire-visible-check-branch`,
      label: "Whether or not smoke has dissipated, if it cannot be visibly verified that the fire has been extinguished",
      steps: [
        { id: `${bleedResponse}-fire-4`, kind: "action", label: "4", text: "Cockpit Door/Curtain — OPEN" },
        { id: `${bleedResponse}-fire-5`, kind: "action", label: "5", text: "Land as soon as possible." },
        {
          id: `${bleedResponse}-fire-source-known`,
          kind: "condition",
          branches: [{
            id: `${bleedResponse}-fire-source-known-branch`,
            label: "6. If source is known",
            steps: [
              { id: `${bleedResponse}-fire-6a`, kind: "action", label: "a", text: "Extinguish fire using hand held extinguisher or eliminate the source of smoke or fumes." },
              {
                id: `${bleedResponse}-fire-6b`,
                kind: "condition",
                branches: [
                  {
                    id: `${bleedResponse}-fire-not-extinguished`,
                    label: "If fire is not extinguished",
                    steps: [
                      { id: `${bleedResponse}-fire-6b1`, kind: "action", label: "(1)", text: "Land as soon as possible." },
                      { id: `${bleedResponse}-fire-6b2`, kind: "information", label: "(2)", text: "This checklist is complete." },
                    ],
                  },
                  {
                    id: `${bleedResponse}-fire-extinguished`,
                    label: "If fire has been extinguished and can be visibly verified",
                    steps: [
                      { id: `${bleedResponse}-fire-6c1`, kind: "action", label: "(1)", text: "Land as soon as practical. At the crew’s discretion, the oxygen system may be returned to normal." },
                      { id: `${bleedResponse}-fire-6c2`, kind: "information", label: "(2)", text: "This checklist is complete." },
                    ],
                  },
                ],
              },
            ],
          }],
        },
      ],
    }],
  },
  {
    id: `${bleedResponse}-fire-smoke-continues`,
    kind: "condition",
    branches: [{
      id: `${bleedResponse}-fire-smoke-continues-branch`,
      label: "If smoke or fumes continue",
      steps: [
        { id: `${bleedResponse}-fire-7`, kind: "action", label: "7", text: bleedResponse === "e22" ? "CABIN AIR Switch — MAX" : "One or Both BLEED AIR Switches — EMER" },
        { id: `${bleedResponse}-fire-8`, kind: "action", label: "8", text: "AUTO-MAN Switch — MAN" },
        { id: `${bleedResponse}-fire-9`, kind: "action", label: "9", text: "UP-DN Manual Control — UP (max. 13,000 ft)" },
      ],
    }],
  },
  {
    id: `${bleedResponse}-fire-isolate-source`,
    kind: "condition",
    branches: [{
      id: `${bleedResponse}-fire-isolate-source-branch`,
      label: "If time & conditions permit, isolate source of smoke and fumes",
      steps: [{
        id: `${bleedResponse}-fire-bleed-source`,
        kind: "condition",
        branches: [{
          id: `${bleedResponse}-fire-bleed-source-branch`,
          label: "10. If bleed air system is suspected source",
          steps: [
            { id: `${bleedResponse}-fire-10a`, kind: "action", label: "a", text: "R BLEED AIR Switch — OFF" },
            {
              id: `${bleedResponse}-fire-10a-result`,
              kind: "condition",
              branches: [
                {
                  id: `${bleedResponse}-fire-smoke-reduced`,
                  label: "If smoke is reduced",
                  steps: [{ id: `${bleedResponse}-fire-smoke-reduced-action`, kind: "action", text: "Continue with switch OFF." }],
                },
                {
                  id: `${bleedResponse}-fire-smoke-not-reduced`,
                  label: "If smoke is not reduced",
                  steps: [
                    { id: `${bleedResponse}-fire-r-bleed-on`, kind: "action", label: "(1)", text: "R BLEED AIR Switch — ON" },
                    { id: `${bleedResponse}-fire-l-bleed-off`, kind: "action", label: "(2)", text: "L BLEED AIR Switch — OFF" },
                    { id: `${bleedResponse}-fire-after-l-bleed`, kind: "information", text: "If smoke is reduced, continue with switch OFF." },
                  ],
                },
              ],
            },
          ],
        }],
      }],
    }],
  },
] as const;

const electricalIsolationSteps = (variant: "e23" | "e23-1") => {
  const newer = variant === "e23-1";
  const copilotBreakers = newer
    ? "TOP ROW: AC BUS TIE, R AC BUS, R AUX AC BUS (if installed), 26 VAC BUS; 2ND ROW: MAIN BUS TIE, R MAIN BUS, R IGN & START, SEC INV; 3RD ROW: ESS A BUS TIE, R ESS A BUS, R STALL WARN; BOTTOM ROW: ESS B BUS TIE, R ESS B BUS, AUX INV (if installed)."
    : "TOP ROW: AC BUS TIE, R AC BUS, R AUX AC BUS (if installed), 26 VAC BUS; 2ND ROW: MAIN BUS TIE, R MAIN BUS, R IGN & ST, SEC INV; 3RD ROW: ESS BUS TIE, R ESS BUS, R STALL WARN, AUX INV (if installed).";
  const pilotBreakers = newer
    ? "TOP ROW: L AC BUS, L AUX AC BUS (if installed), 26 VAC BUS; 2ND ROW: L MAIN BUS, L IGN & START, PRI INV; 3RD ROW: L ESS A BUS, L STALL WARN, DOOR ACTR, ENTRY LT; BOTTOM ROW: L ESS B BUS."
    : "TOP ROW: L AC BUS, L AUX AC BUS (if installed), 26 VAC BUS; 2ND ROW: L MAIN BUS, L IGN & ST, PRI INV; 3RD ROW: L ESS BUS, L STALL WARN, DOOR ACTR, ENTRY LT.";

  return [{
    id: `${variant}-electrical-source`,
    kind: "condition",
    branches: [{
      id: `${variant}-electrical-source-branch`,
      label: "If source is electrical",
      steps: [
        { id: `${variant}-electrical-a`, kind: "action", label: "a", text: "All Non-essential Electrical Equipment — OFF" },
        { id: `${variant}-electrical-b`, kind: "information", label: "b", text: "Isolate defective systems bus as follows." },
        { id: `${variant}-electrical-separation-note`, kind: "information", text: "The following steps separate the pilot and copilot electrical systems. If the electrical smoke or fume source is positively identified on the pilot side, pull all BUS TIE circuit breakers on the copilot circuit breaker panel and proceed with step (4)." },
        { id: `${variant}-electrical-1`, kind: "action", label: "(1)", text: "Copilot’s Circuit Breaker Panel — Pull the following circuit breakers:" },
        { id: `${variant}-electrical-1-list`, kind: "information", text: copilotBreakers },
        { id: `${variant}-electrical-1-result`, kind: "information", text: "All electrical power from the copilot’s circuit breaker panel is now off. Allow time for smoke and fumes to dissipate." },
        {
          id: `${variant}-electrical-continues`,
          kind: "condition",
          branches: [{
            id: `${variant}-electrical-continues-branch`,
            label: "If electrical smoke or fumes continue",
            steps: [
              { id: `${variant}-electrical-2`, kind: "action", label: "(2)", text: "All BUS TIE Circuit Breakers — LEAVE PULLED, DO NOT RESET" },
              { id: `${variant}-electrical-3`, kind: "action", label: "(3)", text: "All other Copilot Circuit Breakers — RESET" },
              { id: `${variant}-electrical-4`, kind: "action", label: "(4)", text: "Pilot’s Circuit Breaker Panel — Pull the following circuit breakers:" },
              { id: `${variant}-electrical-4-list`, kind: "information", text: pilotBreakers },
              { id: `${variant}-electrical-4-result`, kind: "information", text: "All electrical power from the pilot’s circuit breaker panel is now off. Allow time for smoke and fumes to dissipate." },
            ],
          }],
        },
      ],
    }],
  }] as const;
};

const e24Steps = [
  {
    id: "e24-electrical-continues",
    kind: "condition",
    branches: [{
      id: "e24-electrical-continues-branch",
      label: "If electrical smoke or fumes continue, the malfunctioning system is connected to the Emergency Power Supply(ies). In this event",
      steps: [
        { id: "e24-5", kind: "action", label: "(5)", text: "EMER BAT or EMER PWR Switch(es) — OFF" },
      ],
    }],
  },
  {
    id: "e24-restore",
    kind: "condition",
    branches: [{
      id: "e24-restore-branch",
      label: "To restore unaffected electrical systems if necessary (determination of defective system)",
      steps: [
        { id: "e24-11", kind: "action", label: "11", text: "All BUS TIE Circuit Breakers — LEAVE PULLED, DO NOT RESET" },
        { id: "e24-12", kind: "action", label: "12", text: "All Circuit Breakers (on panel with power removed) — PULL" },
        { id: "e24-13", kind: "action", label: "13", text: "One (DC) BUS Circuit Breaker — RESET" },
        { id: "e24-13a", kind: "action", label: "a", text: "Circuit Breakers powered by that BUS — RESET (one at a time)" },
        { id: "e24-13-note-1", kind: "information", text: "Pause after resetting each circuit breaker to determine defective system." },
        { id: "e24-13-note-2", kind: "information", text: "Whenever high electrical loads or smoke or fumes occur, pull the last circuit breaker reset." },
        { id: "e24-13-note-3", kind: "information", text: "Hot-wired circuit breakers (L and R STALL WARN, DOOR ACTR, ENTRY LT, PRI INV and SEC INV circuit breakers) should be reset in sequence with the other circuit breakers on that bus row." },
        { id: "e24-14", kind: "action", label: "14", text: "Repeat step 13 for each DC BUS Circuit Breaker." },
        { id: "e24-15", kind: "action", label: "15", text: "R AC BUS or L AC BUS Circuit Breaker (as applicable) — RESET" },
        { id: "e24-15a", kind: "action", label: "a", text: "Reset circuit breakers powered by that AC BUS. Refer to notes under step 13 above." },
        { id: "e24-16", kind: "action", label: "16", text: "EMER BAT or EMER PWR Switch(es) — ON (one at a time)" },
        { id: "e24-16-note", kind: "information", text: "If smoke and fumes recur, set switch OFF." },
        { id: "e24-17", kind: "action", label: "17", text: "Standby Attitude Gyro — CAGE, then UNCAGE to erect" },
      ],
    }],
  },
] as const;

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

export const learjet35aQrhEmergencyBatch5ReleaseStatus = "staged-source-review" as const;

/**
 * QRH.3F serial/AMK-specific Emergency Procedures batch.
 *
 * Page variants stay independent: CABIN/COCKPIT FIRE combines the applicable
 * E-22/E-22.1 first page with the independently applicable E-23/E-23.1
 * electrical continuation before the common E-24 page. Unknown AMK state is
 * fail-closed wherever source applicability depends on it.
 */
export const learjet35aQrhEmergencyBatch5 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Emergency Procedures — staged source batch 5",
  sourcePolicy: "available-sources",
  sourceNote:
    "Partial QRH.3F source digitization from CL-102B Change 2 Emergency Procedures with explicit serial-number and AMK effectivity. This staged batch is not a standalone production fallback.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "bleed-air-light",
      title: "BLEED AIR LIGHT",
      procedureClass: "emergency",
      category: "Environmental/Door",
      effectivity: {
        kind: "mapped",
        sourceText: "See E-20, E-20.1 and E-20.2 EFFECTIVITY blocks.",
        mappingNote: "The applicable source page is selected from exact aircraft serial number and AMK 76-7 state where required.",
      },
      applicability: bleedFamilyApplicability,
      sources: [
        source("E-20", "BLEED AIR LIGHT"),
        source("E-20.1", "BLEED AIR LIGHT"),
        source("E-20.2", "BLEED AIR LIGHT"),
      ],
      stages: [
        mappedStage(
          "bleed-air-e20",
          "E-20 source variant",
          "E-20",
          "BLEED AIR LIGHT",
          "35-001 thru 35-081 & 35-083 thru 35-086; and 36-001 thru 36-022 not incorporating AMK 76-7",
          bleedE20Applicability,
          [{ id: "bleed-e20-1", kind: "action", label: "1", text: "Corresponding BLEED AIR Switch — OFF" }],
        ),
        mappedStage(
          "bleed-air-e20-1",
          "E-20.1 source variant",
          "E-20.1",
          "BLEED AIR LIGHT",
          "35-082, 35-087 thru 35-106 & 35-108 thru 35-112; 36-023 thru 36-031; and prior aircraft incorporating AMK 76-7",
          bleedE201Applicability,
          [
            {
              id: "bleed-e201-condition",
              kind: "condition",
              branches: [
                {
                  id: "bleed-e201-both",
                  label: "If both BLEED AIR L and BLEED AIR R warning lights illuminate, the secondary pressure regulator of one of the air modulating valves has failed",
                  steps: [
                    { id: "bleed-e201-1", kind: "action", label: "1", text: "R BLEED AIR Switch — OFF" },
                    {
                      id: "bleed-e201-1-result",
                      kind: "condition",
                      branches: [
                        { id: "bleed-e201-1-out", label: "If both lights go out", steps: [{ id: "bleed-e201-1-out-action", kind: "action", text: "Continue flight in this configuration." }] },
                        {
                          id: "bleed-e201-1-stay",
                          label: "If both lights do not go out",
                          steps: [
                            { id: "bleed-e201-2a", kind: "action", label: "2", text: "R BLEED AIR Switch — ON" },
                            { id: "bleed-e201-2b", kind: "action", text: "L BLEED AIR Switch — OFF" },
                            {
                              id: "bleed-e201-2-result",
                              kind: "condition",
                              branches: [
                                { id: "bleed-e201-2-out", label: "If both lights go out", steps: [{ id: "bleed-e201-2-out-action", kind: "action", text: "Continue flight in this configuration." }] },
                                {
                                  id: "bleed-e201-2-stay",
                                  label: "If both lights do not go out",
                                  steps: [{ id: "bleed-e201-3", kind: "action", label: "3", text: "Reduce power alternately on each engine until both lights go out. Continue flight with the appropriate engine at reduced power." }],
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
                  id: "bleed-e201-either",
                  label: "If either BLEED AIR L or BLEED AIR R warning light illuminates, an overheat sensor has tripped the light",
                  steps: [{ id: "bleed-e201-either-1", kind: "action", label: "1", text: "Corresponding BLEED AIR Switch — OFF" }],
                },
              ],
            },
          ],
        ),
        mappedStage(
          "bleed-air-e20-2",
          "E-20.2 source variant",
          "E-20.2",
          "BLEED AIR LIGHT",
          "35-107, 35-113 & on; and 36-032 & on",
          lateBleedSerials,
          [{ id: "bleed-e202-1", kind: "action", label: "1", text: "Corresponding BLEED AIR Switch — OFF" }],
        ),
      ],
    },
    {
      id: "cabin-cockpit-fire-smoke-fumes",
      title: "CABIN/COCKPIT FIRE, SMOKE, OR FUMES",
      procedureClass: "emergency",
      category: "Fire",
      effectivity: {
        kind: "mapped",
        sourceText: "E-22/E-22.1 and E-23/E-23.1 have independent serial/AMK effectivity; E-24 is ALL.",
        mappingNote: "A complete procedure requires the applicable first-page variant and electrical-continuation variant. Prior-aircraft AMK 78-13 state is therefore resolved fail-closed before the common E-24 continuation is exposed.",
      },
      applicability: fireScenarioApplicability,
      sources: [
        source("E-22", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES"),
        source("E-22.1", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES"),
        source("E-23", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — electrical source"),
        source("E-23.1", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — electrical source"),
        source("E-24", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — continuation"),
      ],
      stages: [
        mappedStage(
          "fire-e22",
          "Initial response — E-22",
          "E-22",
          "CABIN/COCKPIT FIRE, SMOKE, OR FUMES",
          "35-001 thru 35-106 & 35-108 thru 35-112; and 36-001 thru 36-031",
          fireFirstPageEarly,
          fireInitialSteps("e22"),
        ),
        mappedStage(
          "fire-e22-1",
          "Initial response — E-22.1",
          "E-22.1",
          "CABIN/COCKPIT FIRE, SMOKE, OR FUMES",
          "35-107, 35-113 & on; and 36-032 & on",
          fireFirstPageLate,
          fireInitialSteps("e22-1"),
        ),
        mappedStage(
          "fire-e23",
          "Electrical source isolation — E-23",
          "E-23",
          "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — electrical source",
          "35-001 thru 35-201 & 35-205; and 36-001 thru 36-040 not incorporating AMK 78-13",
          fireE23Applicability,
          electricalIsolationSteps("e23"),
        ),
        mappedStage(
          "fire-e23-1",
          "Electrical source isolation — E-23.1",
          "E-23.1",
          "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — electrical source",
          "35-202 thru 35-204, 35-206 & on; 36-041 & on; and prior aircraft incorporating AMK 78-13",
          fireE231Applicability,
          electricalIsolationSteps("e23-1"),
        ),
        {
          id: "fire-e24",
          label: "Electrical source continuation — E-24",
          effectivity: { kind: "all-aircraft", sourceText: "ALL" },
          sources: [source("E-24", "CABIN/COCKPIT FIRE, SMOKE, OR FUMES — continuation")],
          steps: e24Steps,
        },
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
