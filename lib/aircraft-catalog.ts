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

export type TrainingAircraftVariantProfile = {
  readonly key: string;
  readonly displayName: string;
  readonly equipmentTags: readonly string[];
  readonly note?: string;
};

export type TrainingAircraftWorkspaceProfile = {
  readonly flyManualId?: string;
  readonly learnManualId?: string;
  readonly supplementaryManualIds?: readonly string[];
};

export type TrainingAircraft = {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly variants: readonly string[];
  /** Equipment common to the aircraft regardless of optional variant selection. */
  readonly equipmentTags?: readonly string[];
  readonly variantProfiles?: readonly TrainingAircraftVariantProfile[];
  readonly displayName: string;
  readonly manuals: readonly TrainingManualRevision[];
  readonly workspaceProfile?: TrainingAircraftWorkspaceProfile;
};

/**
 * Static aircraft data is intentionally empty. Aircraft are onboarded through
 * the governed database workflow instead of being compiled into the product.
 */
export const trainingAircraft: readonly TrainingAircraft[] = [];

export function getTrainingAircraft(id: string): TrainingAircraft | undefined {
  return trainingAircraft.find((aircraft) => aircraft.id === id);
}
