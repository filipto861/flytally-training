export type ScenarioStageId = "recognition" | "control" | "immediate" | "continue";
export type ScenarioDifficulty = "core" | "advanced";
export type ScenarioCategory = string;

export type ScenarioSourceReference = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type ScenarioStage = {
  readonly id: ScenarioStageId;
  readonly prompt: string;
  readonly expectedResponse: readonly string[];
  readonly why: string;
  readonly source: readonly ScenarioSourceReference[];
};

export type AbnormalScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: ScenarioCategory;
  readonly phase: string;
  readonly difficulty: ScenarioDifficulty;
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly stages: readonly ScenarioStage[];
  readonly debrief: readonly string[];
  readonly variantNote?: string;
  readonly trainingBoundary?: string;
};

export type AircraftAbnormalTraining = {
  readonly aircraftId: string;
  readonly sourceNote: string;
  readonly disclaimer: string;
  readonly scenarios: readonly AbnormalScenario[];
};
