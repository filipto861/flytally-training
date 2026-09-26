export type LearjetReferencePerformanceSourceStatus =
  | "available"
  | "not-in-reviewed-source";

export type LearjetReferencePerformanceApplicability =
  | "all"
  | "rosemount-split";

export type LearjetReferencePerformanceFamily = {
  readonly id: string;
  readonly title: string;
  readonly status: LearjetReferencePerformanceSourceStatus;
  readonly applicability: LearjetReferencePerformanceApplicability;
  readonly sourcePages: {
    readonly all?: readonly string[];
    readonly withoutRosemount?: readonly string[];
    readonly withRosemount?: readonly string[];
  };
  readonly inputSemantics: readonly string[];
  readonly directOutputs: readonly string[];
  readonly sourceNotes: readonly string[];
};

export const learjet35aReferencePerformanceSourceInventory = {
  status: "source-inventory-only",
  aircraftId: "learjet-35a",
  source: {
    manualId: "CL-102B",
    document: "Learjet 35/36 Crew Checklist & Quick Reference Handbook",
    baseIssue: "April 2001",
    currentChange: "Change 2 · May 2008",
    section: "Performance Data",
    authority: "manufacturer-checklist-qrh",
  },
  guardrails: [
    "This inventory is not an operational performance dataset and must not be registered in the bundled Performance package.",
    "Reference performance belongs under Reference, not the Takeoff/Landing Performance workspace.",
    "Preserve source page applicability exactly; do not infer an FC-200/FC-530 split where CL-102B marks the table ALL.",
    "Rosemount and non-Rosemount cruise families remain separate because the source publishes distinct indicated-speed/Mach schedules.",
    "Digitization must preserve blank/sparse source cells and may use bounded interpolation only after source geometry is reviewed.",
    "Do not expose High-Speed Cruise until a source table, not only training-manual narrative, is available.",
  ],
  families: [
    {
      id: "climb-two-engine",
      title: "Climb Performance · Two Engine",
      status: "available",
      applicability: "all",
      sourcePages: {
        all: ["P-19", "P-20", "P-21", "P-22", "P-23", "P-24", "P-25", "P-26", "P-27", "P-28"],
      },
      inputSemantics: [
        "start climb weight · lb",
        "pressure altitude · 1000 ft",
        "temperature column · ISA -10 / ISA / ISA +10 / ISA +15 / ISA +20",
      ],
      directOutputs: [
        "time from sea-level baseline · min",
        "distance from sea-level baseline · NM",
        "fuel from sea-level baseline · lb",
      ],
      sourceNotes: [
        "Published climb schedule: 250 KIAS up to 32,000 ft; 0.70 MI above 32,000 ft.",
        "CL-102B marks the climb tables ALL effectivity; do not create an FC-200/FC-530 split from training-manual commentary alone.",
      ],
    },
    {
      id: "long-range-cruise-two-engine",
      title: "Long Range Cruise · Two Engine",
      status: "available",
      applicability: "rosemount-split",
      sourcePages: {
        withoutRosemount: ["P-29", "P-30", "P-31", "P-32", "P-33", "P-34", "P-35", "P-36", "P-37"],
        withRosemount: ["P-29.1", "P-30.1", "P-31.1", "P-32.1", "P-33.1", "P-34.1", "P-35.1", "P-36.1", "P-37.1"],
      },
      inputSemantics: [
        "average gross weight · lb",
        "pressure altitude · 1000 ft",
        "temperature column · ISA -10 / ISA / ISA +10",
      ],
      directOutputs: [
        "Mach indicated",
        "KTAS",
        "specific range · NM/lb",
      ],
      sourceNotes: [
        "Source shading denotes maximum specific range; preserve that source styling separately from numeric values.",
        "Do not convert specific range into a preferred altitude or automatic optimum-cruise recommendation in the first implementation.",
      ],
    },
    {
      id: "normal-cruise-two-engine",
      title: "Normal Cruise · Two Engine",
      status: "available",
      applicability: "rosemount-split",
      sourcePages: {
        withoutRosemount: ["P-38", "P-39", "P-40", "P-41", "P-42", "P-43", "P-44", "P-45", "P-46"],
        withRosemount: ["P-38.1", "P-39.1", "P-40.1", "P-41.1", "P-42.1", "P-43.1", "P-44.1", "P-45.1", "P-46.1"],
      },
      inputSemantics: [
        "average gross weight · lb",
        "pressure altitude · 1000 ft",
        "temperature column · ISA -10 / ISA / ISA +10 / ISA +15 / ISA +20",
      ],
      directOutputs: [
        "KTAS",
        "fuel flow · lb/hr",
      ],
      sourceNotes: [
        "Without Rosemount source pages publish Normal Cruise at Mach 0.77 MI.",
        "With Rosemount source pages publish Normal Cruise at Mach 0.75 MI.",
      ],
    },
    {
      id: "long-range-cruise-one-engine",
      title: "Long Range Cruise · One Engine",
      status: "available",
      applicability: "rosemount-split",
      sourcePages: {
        withoutRosemount: ["P-47", "P-48", "P-49", "P-50", "P-51"],
        withRosemount: ["P-47.1", "P-48.1", "P-49.1", "P-50.1", "P-51.1"],
      },
      inputSemantics: [
        "gross weight · lb",
        "pressure altitude · 1000 ft",
        "temperature column · ISA -10 / ISA / ISA +10 / ISA +15 / ISA +20",
      ],
      directOutputs: [
        "Mach indicated or KIAS as printed for the altitude row",
        "KTAS",
        "fuel flow · lb/hr",
      ],
      sourceNotes: [
        "Preserve the source's mixed Mach/KIAS row semantics rather than normalizing every row to one indicated-speed representation.",
      ],
    },
    {
      id: "high-speed-cruise-two-engine",
      title: "High-Speed Cruise · Two Engine",
      status: "not-in-reviewed-source",
      applicability: "all",
      sourcePages: {},
      inputSemantics: [],
      directOutputs: [],
      sourceNotes: [
        "The reviewed CL-102B Performance Data index does not publish a High-Speed Cruise table.",
        "FlightSafety training material describes High-Speed Cruise conceptually and says Pilot's Manual tables exist, but that narrative is not sufficient for operational digitization.",
      ],
    },
  ] as const satisfies readonly LearjetReferencePerformanceFamily[],
} as const;
