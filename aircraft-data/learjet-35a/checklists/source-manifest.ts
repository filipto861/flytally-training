import type { SourceAuthorityRole } from "../../../lib/source-authority.ts";

export const learjet35aChecklistSourceManifest = {
  aircraftId: "learjet-35a",
  manualId: "CL-102B",
  revisionId: "rev-learjet-cl-102b-change-2",
  title: "Learjet 35/36 Crew Checklist & Quick Reference Handbook",
  publisher: "Bombardier Aerospace (Learjet)",
  sourceKind: "QRH",
  revision: "Change 2",
  issueDate: "2008-05",
  authorityRole: "OPERATING_REFERENCE" as SourceAuthorityRole,
  authorityNote:
    "CL-102B is an operating-reference checklist. Its Important Notice states that the procedures are suggested and do not supersede the FAA Approved Airplane Flight Manual; the AFM takes precedence in a conflict.",
  checksumSha256:
    "6fbddb29b1166f4e2b3093f8fb14c924fd08d0e28cb113ed6de6dd27c98ac049",
  sourceMetadata: {
    intakeMode: "metadata-only",
    documentHostedByFlyTally: false,
    reviewedSourceOriginalName: "028478033.pdf",
    reviewedSourceSizeBytes: 1033806,
    pdfMetadataCreationDate: "2009-04-30T18:59:26Z",
    pdfMetadataModificationDate: "2009-06-15T21:05:56Z",
    baseIssueShownOnNormalProcedurePages: "April 2001",
    incorporatedChanges: [
      "Change 1 · September 2006",
      "Change 2 · May 2008",
    ],
  },
  reference: {
    chapter: "Normal Procedures",
    section: "Normal Procedures",
    pageLabel: "N-2–N-18",
    note:
      "Reviewed normal-checklist range. Exact phase/item page labels remain embedded in the universal checklist payload.",
  },
} as const;
