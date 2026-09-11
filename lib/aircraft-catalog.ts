import type { SourceAuthorityRole } from "./source-authority.ts";

export type CurriculumStatus = "READY_TO_DRAFT" | "PLANNED";

export type ManualChapter = {
  readonly number: number;
  readonly title: string;
  readonly status: CurriculumStatus;
};

export type TrainingManualRevision = {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  readonly revision: string;
  readonly issueDate: string;
  readonly sourceKind: "TRAINING_MANUAL" | "AFM" | "POH" | "FCOM" | "QRH" | "SIMULATOR_MANUAL" | "SIMULATOR_GUIDE";
  readonly authorityRole: SourceAuthorityRole;
  readonly authorityNote: string;
  readonly sourceReferences: {
    readonly identityPage: number;
    readonly authorityNoticePage: number;
    readonly revisionPage: number;
    readonly contentsPage: number;
  };
  readonly chapters: readonly ManualChapter[];
};

/**
 * A variant profile is aircraft data, not application logic. `equipmentTags`
 * contain only explicitly governed installation/configuration facts; the
 * learner runtime must never infer optional equipment from the model name.
 */
export type TrainingAircraftVariantProfile = {
  readonly key: string;
  readonly displayName: string;
  readonly equipmentTags: readonly string[];
  readonly note?: string;
};

export type TrainingAircraft = {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly variants: readonly string[];
  readonly variantProfiles?: readonly TrainingAircraftVariantProfile[];
  readonly displayName: string;
  readonly manuals: readonly TrainingManualRevision[];
};

export const learjet3536: TrainingAircraft = {
  id: "learjet-35-36",
  manufacturer: "Learjet",
  model: "35/36",
  variants: ["35", "35A", "36", "36A"],
  // Deliberately do not infer AAK/ECR installations from a Learjet model name.
  // Governed database metadata can add equipment tags only when the actual
  // aircraft/configuration is known.
  variantProfiles: [
    { key: "35", displayName: "35", equipmentTags: [] },
    { key: "35A", displayName: "35A", equipmentTags: [] },
    { key: "36", displayName: "36", equipmentTags: [] },
    { key: "36A", displayName: "36A", equipmentTags: [] },
  ],
  displayName: "Learjet 35/36",
  manuals: [
    {
      id: "fsi-learjet-35-36-ptm-r1-1",
      title: "Learjet 35/36 Pilot Training Manual",
      publisher: "FlightSafety International",
      revision: "1.1",
      issueDate: "2020-01",
      sourceKind: "TRAINING_MANUAL",
      authorityRole: "TRAINING_REFERENCE",
      authorityNote:
        "Training and familiarization source. Manufacturer and regulatory publications take precedence if information conflicts.",
      sourceReferences: { identityPage: 1, authorityNoticePage: 2, revisionPage: 4, contentsPage: 5 },
      chapters: [
        { number: 1, title: "Aircraft General", status: "READY_TO_DRAFT" },
        { number: 2, title: "Electrical Power Systems", status: "READY_TO_DRAFT" },
        { number: 3, title: "Lighting", status: "READY_TO_DRAFT" },
        { number: 4, title: "Master Warning System", status: "READY_TO_DRAFT" },
        { number: 5, title: "Fuel System", status: "READY_TO_DRAFT" },
        { number: 6, title: "Auxiliary Power Unit", status: "PLANNED" },
        { number: 7, title: "Powerplant", status: "READY_TO_DRAFT" },
        { number: 8, title: "Fire Protection", status: "READY_TO_DRAFT" },
        { number: 9, title: "Pneumatics", status: "READY_TO_DRAFT" },
        { number: 10, title: "Ice and Rain Protection", status: "READY_TO_DRAFT" },
        { number: 11, title: "Air Conditioning", status: "READY_TO_DRAFT" },
        { number: 12, title: "Pressurization", status: "READY_TO_DRAFT" },
        { number: 13, title: "Hydraulic Power System", status: "READY_TO_DRAFT" },
        { number: 14, title: "Landing Gear and Brakes", status: "READY_TO_DRAFT" },
        { number: 15, title: "Flight Controls", status: "READY_TO_DRAFT" },
        { number: 16, title: "Avionics", status: "READY_TO_DRAFT" },
        { number: 17, title: "Miscellaneous Systems", status: "READY_TO_DRAFT" },
        { number: 18, title: "Maneuvers and Procedures", status: "READY_TO_DRAFT" },
        { number: 19, title: "Weight and Balance", status: "READY_TO_DRAFT" },
        { number: 20, title: "Performance", status: "READY_TO_DRAFT" },
        { number: 21, title: "Crew Resource Management", status: "READY_TO_DRAFT" },
      ],
    },
    {
      id: "flysimware-learjet-35a-msfs-v1-2",
      title: "Learjet 35A Version 1.2",
      publisher: "Flysimware",
      revision: "1.2",
      issueDate: "2024",
      sourceKind: "SIMULATOR_MANUAL",
      authorityRole: "SIMULATOR_IMPLEMENTATION",
      authorityNote:
        "Simulator-model implementation reference. Use for Flysimware control locations, modeled behavior and product-specific operation; it does not override real-aircraft training or approved aircraft documentation.",
      sourceReferences: { identityPage: 1, authorityNoticePage: 2, revisionPage: 1, contentsPage: 5 },
      chapters: [],
    },
    {
      id: "jaydee-learjet-35a-checklist-v1-35-wip1",
      title: "Learjet 35A Guide – Checklist & Procedures for MS Flight Simulator",
      publisher: "JayDee",
      revision: "1.35.WIP1",
      issueDate: "2024",
      sourceKind: "SIMULATOR_GUIDE",
      authorityRole: "SIMULATOR_WORKFLOW",
      authorityNote:
        "Simulator workflow reference. The guide explicitly states that some procedures are intentionally altered from real-world procedures; use only as a clearly identified workflow/implementation aid.",
      sourceReferences: { identityPage: 1, authorityNoticePage: 1, revisionPage: 1, contentsPage: 1 },
      chapters: [],
    },
  ],
};

export const trainingAircraft = [learjet3536] as const;

export function getTrainingAircraft(id: string): TrainingAircraft | undefined {
  return trainingAircraft.find((aircraft) => aircraft.id === id);
}
