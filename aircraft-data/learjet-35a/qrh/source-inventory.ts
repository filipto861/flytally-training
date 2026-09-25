/**
 * QRH.1 source inventory only.
 *
 * This is not a publishable abnormal/emergency payload and must never be
 * registered as operational content. It records the reviewed CL-102B index,
 * source semantics and effectivity families that the QRH rebuild must preserve.
 */
import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

export type LearjetQrhSectionKind = "emergency" | "abnormal";

export type LearjetQrhIndexCategory = {
  readonly title: string;
  readonly procedures: readonly string[];
};

export type LearjetQrhEffectivityFamily = {
  readonly pageLabels: readonly string[];
  readonly sourceEffectivity: string;
};

export type LearjetQrhSourceSection = {
  readonly kind: LearjetQrhSectionKind;
  readonly introPageLabels: readonly string[];
  readonly indexPageLabels: readonly string[];
  readonly firstProcedurePageLabel: string;
  readonly lastProcedurePageLabels: readonly string[];
  readonly categories: readonly LearjetQrhIndexCategory[];
  readonly effectivityFamilies: readonly LearjetQrhEffectivityFamily[];
};

const emergencyCategories = [
  {
    title: "Doors",
    procedures: ["DOOR LIGHT"],
  },
  {
    title: "Electrical",
    procedures: [
      "AC INVERTER FAILURE — TOTAL",
      "BATTERY OVERHEAT LIGHT(S) (NICAD ONLY)",
      "CURRENT LIMITER FAILURE",
      "ESSENTIAL BUS FAILURE — DC POWER LOSS",
      "GENERATOR FAILURE (DUAL)",
    ],
  },
  {
    title: "Engine",
    procedures: [
      "ENGINE FAILURE",
      "ENGINE FIRE — SHUTDOWN",
      "AIRSTART ENVELOPE",
      "STARTER–ASSIST AIRSTART (FUEL COMPUTER ON)",
      "WINDMILLING AIRSTART (FUEL COMPUTER ON)",
      "STARTER–ASSIST AIRSTART (FUEL COMPUTER OFF)",
      "WINDMILLING AIRSTART (FUEL COMPUTER OFF)",
      "OIL PRESSURE LIGHT",
    ],
  },
  {
    title: "Environmental/Door",
    procedures: [
      "BLEED AIR LIGHT",
      "CABIN ALTITUDE WARNING HORN ACTIVATES OR CABIN ALTITUDE EXCEEDS 10,000 FEET (EMERGENCY DESCENT)",
    ],
  },
  {
    title: "Fire",
    procedures: ["CABIN/COCKPIT FIRE, SMOKE, OR FUMES"],
  },
  {
    title: "Flight Controls",
    procedures: [
      "CONTROL SYSTEM JAM",
      "OVERSPEED RECOVERY — OVERSPEED WARNING HORN ACTIVATES",
      "PITCH AXIS MALFUNCTION",
      "ROLL OR YAW AXIS MALFUNCTION",
    ],
  },
  {
    title: "Fuel",
    procedures: ["FUEL PRESS LIGHT"],
  },
  {
    title: "Landings",
    procedures: [
      "DITCHING",
      "EMERGENCY BRAKING",
      "EMERGENCY EVACUATION",
      "LANDING — BOTH ENGINES INOP",
    ],
  },
  {
    title: "Stall Warning",
    procedures: ["STALL WARNING ACTIVATES"],
  },
  {
    title: "Takeoff",
    procedures: ["ABORTED TAKEOFF"],
  },
  {
    title: "Thrust Reversers",
    procedures: [
      "INADVERTENT THRUST REVERSER DEPLOYMENT DURING TAKEOFF",
      "INDICATION OF THRUST REVERSER DEPLOYMENT DURING TAKEOFF (TR-4000 THRUST REVERSERS ONLY)",
    ],
  },
] as const satisfies readonly LearjetQrhIndexCategory[];

const abnormalCategories = [
  {
    title: "Anti-Icing",
    procedures: [
      "ALC AI LIGHT",
      "ENGINE ICE INGESTION",
      "ENG ICE LIGHT",
      "INADVERTENT ICING ENCOUNTER",
      "PITOT HT LIGHT",
      "STABILIZER HEAT FAILURE",
      "STAB OV HT LIGHT",
      "WING HEAT FAILURE",
      "WING OV HT LIGHT",
      "WINDSHIELD HEAT FAILURE",
      "WSHLD DEFOG LIGHT",
      "WSHLD OV HT LIGHT",
    ],
  },
  {
    title: "Electrical",
    procedures: [
      "GENERATOR FAILURE (SINGLE)",
      "INVERTER FAILURE — PARTIAL AC POWER LOSS",
    ],
  },
  {
    title: "Engine",
    procedures: [
      "ABNORMAL ENGINE OPERATION",
      "FUEL CMPTR LIGHT",
      "ENG CHIP LIGHT",
      "ENGINE OVERSPEED",
      "ENGINE SHUTDOWN IN FLIGHT",
      "STARTER ENGAGED LIGHT",
    ],
  },
  {
    title: "Environmental",
    procedures: [
      "FAILURE TO DEPRESSURIZE",
      "INADVERTENT ACTIVATION OF EMERGENCY AIRFLOW",
      "OVERPRESSURIZATION",
      "CAB ALT LIGHT OR CABIN ALTITUDE EXCEEDS 8500 FEET",
      "RETURN TO NORMAL PRESSURIZATION",
    ],
  },
  {
    title: "Flight Controls",
    procedures: [
      "AUG AIL LIGHT",
      "MACH TRIM MALFUNCTION",
      "PITCH TRIM LIGHT IN FLIGHT",
      "STALL WARNING SYSTEM FAILURE",
      "YAW DAMPER FAILURE",
    ],
  },
  {
    title: "Fuel",
    procedures: [
      "CROSSFLOW VALVE FAILS TO OPEN",
      "FUEL FILTER LIGHT",
      "FUEL IMBALANCE DURING FUEL TRANSFER",
      "FUEL JETTISON",
      "FUEL TRANSFER VALVE FAILS TO CLOSE",
      "FUEL VALVE LIGHT(S)",
      "LOW FUEL LIGHT",
      "NORMAL FUEL TRANSFER SYSTEM FAILURE",
      "STANDBY PUMP FAILS TO SHUT OFF",
      "TIP TANK FAILS TO TRANSFER FUEL",
    ],
  },
  {
    title: "Hydraulic",
    procedures: [
      "LO HYD LIGHT (LOW HYDRAULIC PRESSURE)",
      "HYDRAULIC SYSTEM FAILURE/ALTERNATE GEAR EXTENSION",
    ],
  },
  {
    title: "Instruments",
    procedures: [
      "PITOT-STATIC SYSTEM MALFUNCTION",
      "V.G. MON LIGHT",
    ],
  },
  {
    title: "Landing Gear",
    procedures: [
      "ALTERNATE GEAR EXTENSION/ELECTRICAL MALFUNCTION",
      "ANTI-SKID GEN LIGHT — ANTI-SKID OFF OPERATION",
      "NOSE WHEEL STEERING MALFUNCTION",
    ],
  },
  {
    title: "Landings",
    procedures: [
      "GEAR UP",
      "HYDRAULIC SYSTEM FAILURE",
      "JAMMED STABILIZER",
      "ONE OR BOTH SPOILERS UP",
      "PARTIAL FLAP",
      "SINGLE-ENGINE",
      "STABILIZER HEAT FAILURE",
      "WING HEAT FAILURE",
      "WING & STAB HEAT FAILURE",
      "ONE THRUST REVERSER DEPLOYED",
    ],
  },
  {
    title: "Turbulence",
    procedures: ["TURBULENT AIR PENETRATION"],
  },
  {
    title: "Thrust Reversers — Aeronca",
    procedures: [
      "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
      "UNLOCK LIGHT IN FLIGHT (THRUST REVERSER NOT DEPLOYED)",
      "UNLOCK LIGHT AFTER NORMAL DEPLOY",
      "FAILURE OF THRUST REVERSER TO STOW AFTER LANDING",
    ],
  },
  {
    title: "Thrust Reversers — TR-4000",
    procedures: [
      "ANNUNCIATED THRUST REVERSER MALFUNCTION (REVERSER NOT DEPLOYED)",
      "INADVERTENT THRUST REVERSER DEPLOYMENT DURING FLIGHT",
      "THRUST REVERSER RESTOW ENVELOPE",
    ],
  },
] as const satisfies readonly LearjetQrhIndexCategory[];

export const learjet35aQrhSourceInventory = {
  source: {
    aircraftId: learjet35aChecklistSourceManifest.aircraftId,
    manualId: learjet35aChecklistSourceManifest.manualId,
    revisionId: learjet35aChecklistSourceManifest.revisionId,
    title: learjet35aChecklistSourceManifest.title,
    revision: learjet35aChecklistSourceManifest.revision,
    issueDate: learjet35aChecklistSourceManifest.issueDate,
    authorityRole: learjet35aChecklistSourceManifest.authorityRole,
    sourcePolicy: "available-sources",
    operationalPrecedence:
      "CL-102B states that these suggested procedures do not supersede the current FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
    effectivitySemantics:
      "Each checklist text page carries an effectivity block. Page-level effectivity must be reviewed before the procedure is made available for an aircraft configuration.",
    memoryItemSemantics:
      "CL-102B identifies memory items by boxed presentation. Memory status must be captured explicitly from the source presentation and must not be inferred from a procedure or stage title.",
  },
  sections: [
    {
      kind: "emergency",
      introPageLabels: ["E-i", "E-ii"],
      indexPageLabels: ["E-1", "E-2"],
      firstProcedurePageLabel: "E-4",
      lastProcedurePageLabels: ["E-35", "E-35.1"],
      categories: emergencyCategories,
      effectivityFamilies: [
        {
          pageLabels: ["E-6", "E-6.1"],
          sourceEffectivity:
            "Battery/current-limiter family split at 35-509 / 36-054 and AMK 85-1 incorporation.",
        },
        {
          pageLabels: ["E-7–E-8", "E-7.1–E-8.1"],
          sourceEffectivity:
            "Electrical family split by early/late serial groups and AMK 78-13 incorporation.",
        },
        {
          pageLabels: ["E-20", "E-20.1", "E-20.2"],
          sourceEffectivity:
            "Bleed-air family has three serial/AMK 76-7 effectivity groups.",
        },
        {
          pageLabels: ["E-22", "E-22.1"],
          sourceEffectivity:
            "Procedure wording/equipment effectivity split at 35-107/35-113 and 36-032.",
        },
        {
          pageLabels: ["E-23", "E-23.1"],
          sourceEffectivity:
            "Procedure family split by early/late serial groups and AMK 78-13 incorporation.",
        },
        {
          pageLabels: ["E-35", "E-35.1"],
          sourceEffectivity:
            "Thrust-reverser emergency procedure split between Aeronca and TR-4000 installations.",
        },
      ],
    },
    {
      kind: "abnormal",
      introPageLabels: ["A-i", "A-ii"],
      indexPageLabels: ["A-1", "A-1.1", "A-2", "A-3"],
      firstProcedurePageLabel: "A-4",
      lastProcedurePageLabels: ["A-35", "A-35.1", "A-35.2"],
      categories: abnormalCategories,
      effectivityFamilies: [
        {
          pageLabels: ["A-1", "A-1.1", "A-6–A-9", "A-6.1–A-9.1", "A-15–A-16", "A-15.1–A-16.1"],
          sourceEffectivity:
            "Multiple abnormal families split at 35-107/35-113 and 36-032.",
        },
        {
          pageLabels: ["A-25", "A-25.1"],
          sourceEffectivity:
            "Pitot-static abnormal procedure split between non-Rosemount and Rosemount installations.",
        },
        {
          pageLabels: ["A-33–A-35", "A-33.1–A-35.1", "A-33.2–A-35.2"],
          sourceEffectivity:
            "Thrust-reverser abnormal procedures have separate no-reverser, Aeronca and TR-4000 families.",
        },
      ],
    },
  ] satisfies readonly LearjetQrhSourceSection[],
} as const;

export const learjet35aQrhContractAudit = {
  preservedByCurrentContract: [
    "procedure title/category",
    "source WARNING/CAUTION/NOTE notices",
    "page-level source references",
    "scenario/stage applicability filtering",
    "ordered action text",
  ],
  gaps: [
    {
      id: "procedure-class",
      finding:
        "The universal abnormal content does not explicitly distinguish Emergency from Abnormal procedures, while the operational QRH UI visibly labels every rendered procedure as EMERGENCY.",
    },
    {
      id: "memory-items",
      finding:
        "CL-102B memory items are source presentation semantics, but the operational UI currently infers immediate/memory emphasis from stage-label text.",
    },
    {
      id: "training-required-fields",
      finding:
        "The universal abnormal scenario contract requires training metadata that CL-102B operational QRH procedures do not provide.",
    },
    {
      id: "conditional-structure",
      finding:
        "Flat expectedResponse arrays cannot faithfully encode source conditional branches and nested substeps without flattening their semantics.",
    },
    {
      id: "serial-effectivity",
      finding:
        "The generic applicability model has equipment/modification state but no first-class aircraft serial-number range, while CL-102B contains serial/AMK page effectivity.",
    },
    {
      id: "section-intro",
      finding:
        "CL-102B Emergency and Abnormal sections each carry section-level operating principles that are not represented in the current operational QRH DTO.",
    },
  ],
} as const;
