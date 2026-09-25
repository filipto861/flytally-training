import { learjet35aChecklistSourceManifest } from "../checklists/source-manifest.ts";

export const learjet35aQrhSourceManifest = {
  ...learjet35aChecklistSourceManifest,
  references: [
    {
      chapter: "Emergency Procedures",
      section: "Emergency Procedures",
      pageLabel: "E-i–E-35.1",
      note:
        "Reviewed CL-102B Emergency Procedures section, including index, text procedures, effectivity variants, boxed-memory presentation and E-13 Airstart Envelope.",
    },
    {
      chapter: "Abnormal Procedures",
      section: "Abnormal Procedures",
      pageLabel: "A-i–A-35.2",
      note:
        "Reviewed CL-102B Abnormal Procedures section, including index, text procedures, effectivity variants and A-35.2 Thrust Reverser Restow Envelope.",
    },
  ],
} as const;
