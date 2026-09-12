export type LearningSourceReference = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type QuickStartTopic = {
  readonly id: string;
  readonly title: string;
  readonly minutes: number;
  readonly summary: string;
  readonly remember: readonly string[];
  readonly source: readonly LearningSourceReference[];
};

export type EssentialSystemLesson = {
  readonly id: string;
  readonly title: string;
  readonly minutes: number;
  readonly mentalModel: string;
  readonly pilotControls: readonly string[];
  readonly pilotMonitors: readonly string[];
  readonly normalPicture: readonly string[];
  readonly remember: readonly string[];
  readonly variantNote?: string;
  readonly source: readonly LearningSourceReference[];
};

export type AircraftLearningContent = {
  readonly aircraftId: string;
  readonly quickStartTitle: string;
  readonly quickStartDescription: string;
  readonly quickStart: readonly QuickStartTopic[];
  readonly systems: readonly EssentialSystemLesson[];
};
