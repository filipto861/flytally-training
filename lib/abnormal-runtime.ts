import type { AircraftAbnormalTraining } from "./abnormal-scenarios.ts";
import type { TrainingNotice } from "./universal-aircraft-content.ts";
import type {
  AircraftAbnormalEmergencyContent,
  AircraftQrhStage,
} from "./universal-abnormal-emergency.ts";

export type RuntimeScenarioSource = {
  readonly manualId?: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
};

export type RuntimeAbnormalStage = {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly expectedResponse: readonly string[];
  readonly explanation: string;
  readonly notices?: readonly TrainingNotice[];
  readonly sources: readonly RuntimeScenarioSource[];
};

export type RuntimeAbnormalScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly phase: string;
  readonly difficulty: "core" | "advanced";
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly stages: readonly RuntimeAbnormalStage[];
  readonly debrief: readonly string[];
  readonly notices?: readonly TrainingNotice[];
  readonly configurationNote?: string;
  readonly boundaryNote?: string;
};

export type RuntimeAbnormalTraining = {
  readonly aircraftId: string;
  readonly title: string;
  readonly sourceNote?: string;
  readonly disclaimer?: string;
  readonly scenarios: readonly RuntimeAbnormalScenario[];
};

const legacyStageLabels: Readonly<Record<string, string>> = {
  recognition: "Recognize",
  control: "Fly the aircraft",
  immediate: "Immediate action",
  continue: "Continue",
};

function runtimeSources(
  sources: readonly {
    readonly manualId: string;
    readonly chapter?: string;
    readonly section?: string;
    readonly pageLabel: string;
  }[],
): readonly RuntimeScenarioSource[] {
  return sources.map((source) => ({
    manualId: source.manualId,
    chapter: source.chapter,
    section: source.section,
    pageLabel: source.pageLabel,
  }));
}

/**
 * Current scenario training is intentionally linear. A v2 source procedure
 * with conditional branches must not be flattened into invented training
 * expectations; it stays QRH-only until training supports those semantics.
 */
function linearStageResponses(stage: AircraftQrhStage): readonly string[] | undefined {
  const responses: string[] = [];
  for (const step of stage.steps) {
    if (step.kind !== "action") return undefined;
    responses.push(step.text);
  }
  return responses.length ? responses : undefined;
}

export function normalizeUniversalAbnormalEmergency(content: AircraftAbnormalEmergencyContent): RuntimeAbnormalTraining {
  if (content.schemaVersion === 2) {
    const scenarios: RuntimeAbnormalScenario[] = [];

    for (const scenario of content.scenarios) {
      if (!scenario.training) continue;
      const guidance = new Map(scenario.training.stages.map((stage) => [stage.stageId, stage] as const));
      const runtimeStages: RuntimeAbnormalStage[] = [];
      let supported = true;

      for (const stage of scenario.stages) {
        const trainingStage = guidance.get(stage.id);
        const expectedResponse = linearStageResponses(stage);
        if (!trainingStage || !expectedResponse) {
          supported = false;
          break;
        }
        runtimeStages.push({
          id: stage.id,
          label: stage.label,
          prompt: trainingStage.prompt,
          expectedResponse,
          explanation: trainingStage.explanation,
          notices: stage.notices,
          sources: runtimeSources(stage.sources),
        });
      }

      if (!supported) continue;
      scenarios.push({
        id: scenario.id,
        title: scenario.title,
        category: scenario.category,
        phase: scenario.phase ?? "Unspecified",
        difficulty: scenario.training.difficulty,
        minutes: scenario.training.minutes,
        summary: scenario.training.summary,
        setup: scenario.training.setup,
        objectives: scenario.training.objectives,
        debrief: scenario.training.debrief,
        notices: scenario.notices,
        configurationNote: scenario.applicability?.note,
        boundaryNote: scenario.boundaryNote,
        stages: runtimeStages,
      });
    }

    return {
      aircraftId: content.aircraftId,
      title: content.title,
      sourceNote: content.sourceNote,
      disclaimer: content.disclaimer,
      scenarios,
    };
  }

  return {
    aircraftId: content.aircraftId,
    title: content.title,
    sourceNote: content.sourceNote,
    disclaimer: content.disclaimer,
    scenarios: content.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      category: scenario.category,
      phase: scenario.phase,
      difficulty: scenario.difficulty,
      minutes: scenario.minutes,
      summary: scenario.summary,
      setup: scenario.setup,
      objectives: scenario.objectives,
      debrief: scenario.debrief,
      notices: scenario.notices,
      configurationNote: scenario.applicability?.note,
      boundaryNote: scenario.boundaryNote,
      stages: scenario.stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        prompt: stage.prompt,
        expectedResponse: stage.expectedResponse,
        explanation: stage.explanation,
        notices: stage.notices,
        sources: runtimeSources(stage.sources),
      })),
    })),
  };
}

export function normalizeLegacyAbnormalTraining(content: AircraftAbnormalTraining): RuntimeAbnormalTraining {
  return {
    aircraftId: content.aircraftId,
    title: "Abnormal & Emergency Training",
    sourceNote: content.sourceNote,
    disclaimer: content.disclaimer,
    scenarios: content.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      category: scenario.category,
      phase: scenario.phase,
      difficulty: scenario.difficulty,
      minutes: scenario.minutes,
      summary: scenario.summary,
      setup: scenario.setup,
      objectives: scenario.objectives,
      debrief: scenario.debrief,
      configurationNote: scenario.variantNote,
      boundaryNote: scenario.trainingBoundary,
      stages: scenario.stages.map((stage) => ({
        id: stage.id,
        label: legacyStageLabels[stage.id] ?? stage.id,
        prompt: stage.prompt,
        expectedResponse: stage.expectedResponse,
        explanation: stage.why,
        sources: stage.source.map((source) => ({
          chapter: String(source.chapter),
          section: source.section,
          pageLabel: source.manualPage,
        })),
      })),
    })),
  };
}
