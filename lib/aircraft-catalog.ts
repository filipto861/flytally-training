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

export type TrainingAircraft = {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly variants: readonly string[];
  readonly displayName: string;
  readonly manuals: readonly TrainingManualRevision[];
};

export const learjet3536: TrainingAircraft = {
  id: "learjet-35-36",
  manufacturer: "Learjet",
  model: "35/36",
  variants: ["35", "35A", "36", "36A"],
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
      sourceReferences: {
        identityPage: 1,
        authorityNoticePage: 2,
        revisionPage: 4,
        contentsPage: 5,
      },
      chapters: [
        { number: 1, title: "Aircraft General", status: "READY_TO_DRAFT" },
        { number: 2, title: "Electrical Power Systems", status: "PLANNED" },
        { number: 3, title: "Lighting", status: "PLANNED" },
        { number: 4, title: "Master Warning System", status: "PLANNED" },
        { number: 5, title: "Fuel System", status: "PLANNED" },
        { number: 6, title: "Auxiliary Power Unit", status: "PLANNED" },
        { number: 7, title: "Powerplant", status: "PLANNED" },
        { number: 8, title: "Fire Protection", status: "PLANNED" },
        { number: 9, title: "Pneumatics", status: "PLANNED" },
        { number: 10, title: "Ice and Rain Protection", status: "PLANNED" },
        { number: 11, title: "Air Conditioning", status: "PLANNED" },
        { number: 12, title: "Pressurization", status: "PLANNED" },
        { number: 13, title: "Hydraulic Power System", status: "PLANNED" },
        { number: 14, title: "Landing Gear and Brakes", status: "PLANNED" },
        { number: 15, title: "Flight Controls", status: "PLANNED" },
        { number: 16, title: "Avionics", status: "PLANNED" },
        { number: 17, title: "Miscellaneous Systems", status: "PLANNED" },
        { number: 18, title: "Maneuvers and Procedures", status: "PLANNED" },
        { number: 19, title: "Weight and Balance", status: "PLANNED" },
        { number: 20, title: "Performance", status: "PLANNED" },
        { number: 21, title: "Crew Resource Management", status: "PLANNED" },
      ],
    },
  ],
};

export const trainingAircraft = [learjet3536] as const;

export function getTrainingAircraft(id: string): TrainingAircraft | undefined {
  return trainingAircraft.find((aircraft) => aircraft.id === id);
}
