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

const serialFamily: AircraftApplicability = { anyOf: [earlySerials, lateSerials] };

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

const sourceMapped = (
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

const generatorSteps: AircraftQrhStage["steps"] = [
  { id: "gen-single-1", kind: "action", label: "1", text: "Electrical Load — REDUCE" },
  { id: "gen-single-1a", kind: "action", label: "a", text: "Air Conditioner — OFF" },
  { id: "gen-single-1b", kind: "action", label: "b", text: "Other Loads — SHED AS REQ’D" },
  { id: "gen-single-2", kind: "action", label: "2", text: "IGN & ST CB (main power bus) — CHECK & RESET" },
  { id: "gen-single-3", kind: "action", label: "3", text: "Start-Gen Switch — GEN" },
  { id: "gen-single-4", kind: "action", label: "4", text: "Generator Reset Switch — DEPRESS (momentarily)" },
  {
    id: "gen-single-first-fail",
    kind: "condition",
    branches: [{
      id: "gen-single-first-fail-branch",
      label: "If generator does not reset",
      steps: [
        { id: "gen-single-5", kind: "action", label: "5", text: "Turbine Speed (N2) — 80% or ABOVE" },
        { id: "gen-single-6", kind: "action", label: "6", text: "Start-Gen Switch — OFF then GEN" },
        { id: "gen-single-7", kind: "action", label: "7", text: "Generator Reset Switch — DEPRESS (momentarily)" },
        {
          id: "gen-single-second-fail",
          kind: "condition",
          branches: [{
            id: "gen-single-second-fail-branch",
            label: "If generator does not reset",
            steps: [
              { id: "gen-single-8", kind: "action", label: "8", text: "Start-Gen Switch — OFF" },
            ],
          }],
        },
      ],
    }],
  },
];

export const learjet35aQrhAbnormalBatch2ReleaseStatus =
  "staged-source-review" as const;

export const learjet35aQrhAbnormalBatch2 = {
  schemaVersion: 2,
  aircraftId: "learjet-35a",
  title: "Learjet 35/36 Abnormal Procedures — staged source batch 2",
  sourcePolicy: "available-sources",
  sourceNote:
    "QRH.3I source digitization of the two Electrical abnormal procedures from CL-102B A-9/A-9.1 and A-10. Visual source review found no boxed memory items.",
  disclaimer:
    "CL-102B states that its procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  scenarios: [
    {
      id: "generator-failure-single",
      title: "GENERATOR FAILURE (SINGLE)",
      procedureClass: "abnormal",
      category: "Electrical",
      effectivity: {
        kind: "mapped",
        sourceText: "A-9/A-9.1 serial-number effectivity",
        mappingNote:
          "The response is repeated on both source pages; page provenance follows the exact aircraft serial family.",
      },
      applicability: serialFamily,
      sources: [
        source("A-9", "GENERATOR FAILURE (SINGLE)"),
        source("A-9.1", "GENERATOR FAILURE (SINGLE)"),
      ],
      stages: [
        sourceMapped(
          "generator-single-a9",
          "A-9 source variant",
          "A-9",
          "GENERATOR FAILURE (SINGLE)",
          "35-001 thru 35-106, 35-108 thru 35-112; and 36-001 thru 36-031",
          earlySerials,
          generatorSteps,
        ),
        sourceMapped(
          "generator-single-a9-1",
          "A-9.1 source variant",
          "A-9.1",
          "GENERATOR FAILURE (SINGLE)",
          "35-107, 35-113 & on; and 36-032 & on",
          lateSerials,
          generatorSteps,
        ),
      ],
    },
    {
      id: "inverter-failure-partial-ac-power-loss",
      title: "INVERTER FAILURE — PARTIAL AC POWER LOSS",
      procedureClass: "abnormal",
      category: "Electrical",
      effectivity: { kind: "all-aircraft", sourceText: "ALL" },
      sources: [source("A-10", "INVERTER FAILURE — PARTIAL AC POWER LOSS")],
      stages: [
        sourceAll(
          "inverter-pri-sec-a10",
          "FAILURE OF PRI OR SEC INVERTER SYSTEM",
          "A-10",
          "INVERTER FAILURE — PARTIAL AC POWER LOSS — FAILURE OF PRI OR SEC INVERTER SYSTEM",
          [
            { id: "inverter-1", kind: "action", label: "1", text: "Affected INV (main power bus) & AC BUS (AC bus) CBs — CHECK & RESET" },
            { id: "inverter-2", kind: "action", label: "2", text: "Failed Inverter — OFF then ON" },
            { id: "inverter-3", kind: "action", label: "3", text: "Failed INV CB — PULL then RESET" },
            {
              id: "inverter-malfunction-persists",
              kind: "condition",
              branches: [{
                id: "inverter-malfunction-persists-branch",
                label: "If malfunction does not clear",
                steps: [
                  { id: "inverter-4", kind: "action", label: "4", text: "Failed Inverter — OFF" },
                  { id: "inverter-5", kind: "action", label: "5", text: "Corresponding AC BUS CB — PULL" },
                  { id: "inverter-6", kind: "action", label: "6", text: "AC BUS TIE CB (copilot’s panel) — CHECK & RESET" },
                  { id: "inverter-6-note", kind: "information", text: "If CB opens after resetting, leave it open." },
                  { id: "inverter-7", kind: "action", label: "7", text: "Aux Inverter (if installed) — FAILED BUS (L or R)" },
                  {
                    id: "inverter-aux-malfunctions",
                    kind: "condition",
                    branches: [{
                      id: "inverter-aux-malfunctions-branch",
                      label: "If auxiliary inverter system malfunctions",
                      steps: [
                        { id: "inverter-aux-a", kind: "action", label: "a", text: "Corresponding AUX AC BUS CB (AC bus) — PULL" },
                        { id: "inverter-aux-b", kind: "action", label: "b", text: "Aux Inverter — OPPOSITE AC BUS" },
                        { id: "inverter-aux-c", kind: "action", label: "c", text: "AUX INV CB (copilot’s ess bus) — CHECK & RESET" },
                      ],
                    }],
                  },
                ],
              }],
            },
          ],
        ),
        sourceAll(
          "inverter-aux-a10",
          "FAILURE OF AUXILIARY INVERTER SYSTEM (IF INSTALLED)",
          "A-10",
          "INVERTER FAILURE — PARTIAL AC POWER LOSS — FAILURE OF AUXILIARY INVERTER SYSTEM (IF INSTALLED)",
          [
            { id: "inverter-aux-only-1", kind: "action", label: "1", text: "Aux Inverter — OFF" },
            { id: "inverter-aux-only-2", kind: "action", label: "2", text: "L and R AUX AC BUS CBs (AC buses) — PULL" },
          ],
        ),
      ],
    },
  ],
} as const satisfies AircraftAbnormalEmergencyV2Content;
