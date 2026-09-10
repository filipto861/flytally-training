import type {
  AircraftApplicability,
  TrainingNotice,
  TrainingSourceReference,
  UniversalModuleMetadata,
} from "./universal-aircraft-content.ts";

export type AircraftAbnormalEmergencyStage = {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly expectedResponse: readonly string[];
  readonly explanation: string;
  readonly notices?: readonly TrainingNotice[];
  readonly applicability?: AircraftApplicability;
  readonly sources: readonly TrainingSourceReference[];
};

export type AircraftAbnormalEmergencyScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly phase: string;
  readonly difficulty: "core" | "advanced";
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly stages: readonly AircraftAbnormalEmergencyStage[];
  readonly debrief: readonly string[];
  readonly notices?: readonly TrainingNotice[];
  /** Explicit source/authority boundary retained with this scenario. */
  readonly boundaryNote?: string;
  readonly applicability?: AircraftApplicability;
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftAbnormalEmergencyContent = UniversalModuleMetadata & {
  readonly aircraftId: string;
  readonly title: string;
  readonly scenarios: readonly AircraftAbnormalEmergencyScenario[];
};

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const objects = (value: unknown): value is RecordValue[] => Array.isArray(value) && value.every(object);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(text);
const positiveNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

function sources(value: unknown): boolean {
  return objects(value) && value.length > 0 && value.every((item) =>
    text(item.manualId) &&
    text(item.pageLabel) &&
    (item.chapter === undefined || text(item.chapter)) &&
    (item.section === undefined || text(item.section)) &&
    (item.note === undefined || text(item.note))
  );
}

function optionalSources(value: unknown): boolean {
  return value === undefined || sources(value);
}

function notices(value: unknown): boolean {
  if (value === undefined) return true;
  return objects(value) && value.every((item) =>
    (item.kind === "note" || item.kind === "caution" || item.kind === "warning") && text(item.text)
  );
}

export function validateUniversalAbnormalEmergencyPayload(payload: unknown): string[] {
  const errors: string[] = [];
  if (!object(payload)) return ["abnormal payload must be an object"];
  if (!text(payload.aircraftId)) errors.push("abnormal aircraftId is required");
  if (!text(payload.title)) errors.push("abnormal title is required");
  if (payload.sourceNote !== undefined && !text(payload.sourceNote)) errors.push("abnormal sourceNote must be non-empty text when supplied");
  if (payload.disclaimer !== undefined && !text(payload.disclaimer)) errors.push("abnormal disclaimer must be non-empty text when supplied");

  if (!objects(payload.scenarios) || payload.scenarios.length === 0) {
    errors.push("abnormal scenarios are required");
    return errors;
  }

  payload.scenarios.forEach((scenario, scenarioIndex) => {
    if (
      !text(scenario.id) ||
      !text(scenario.title) ||
      !text(scenario.category) ||
      !text(scenario.phase) ||
      (scenario.difficulty !== "core" && scenario.difficulty !== "advanced") ||
      !positiveNumber(scenario.minutes) ||
      !text(scenario.summary) ||
      !text(scenario.setup) ||
      !strings(scenario.objectives) ||
      !strings(scenario.debrief) ||
      !notices(scenario.notices) ||
      (scenario.boundaryNote !== undefined && !text(scenario.boundaryNote)) ||
      !optionalSources(scenario.sources)
    ) {
      errors.push(`scenarios[${scenarioIndex}] does not match the universal abnormal scenario contract`);
      return;
    }

    if (!objects(scenario.stages) || scenario.stages.length === 0) {
      errors.push(`scenarios[${scenarioIndex}].stages must contain at least one stage`);
      return errors;
    }

    scenario.stages.forEach((stage, stageIndex) => {
      if (
        !text(stage.id) ||
        !text(stage.label) ||
        !text(stage.prompt) ||
        !strings(stage.expectedResponse) ||
        !text(stage.explanation) ||
        !notices(stage.notices) ||
        !sources(stage.sources)
      ) {
        errors.push(`scenarios[${scenarioIndex}].stages[${stageIndex}] does not match the universal abnormal stage contract`);
      }
    });
  });

  return errors;
}

export function isUniversalAbnormalEmergencyContent(value: unknown): value is AircraftAbnormalEmergencyContent {
  return validateUniversalAbnormalEmergencyPayload(value).length === 0;
}
