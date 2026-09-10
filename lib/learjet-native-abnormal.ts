import { learjet3536AbnormalTraining } from "./abnormal-scenarios.ts";
import type { TrainingSourceReference } from "./universal-aircraft-content.ts";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency.ts";

const FSI_MANUAL_ID = "fsi-learjet-35-36-ptm-r1-1";

const stageLabels: Readonly<Record<string, string>> = {
  recognition: "Recognize",
  control: "Fly the aircraft",
  immediate: "Immediate action",
  continue: "Continue",
};

/**
 * Migrate only training-context vocabulary. Technical claims, numeric values,
 * sequence and source locations remain exactly those of the reviewed legacy
 * source-backed payload.
 */
function realStandardTrainingText(value: string): string {
  return value
    .replace(/\bsimulator tail(?:'s)?\b/gi, "aircraft configuration")
    .replace(/\bsimulator profile\b/gi, "training profile")
    .replace(/\bsimulator aircraft(?:'s)?\b/gi, "aircraft")
    .replace(/\bsimulator\b/gi, "aircraft");
}

function source(reference: { readonly chapter: number; readonly section: string; readonly manualPage: string }): TrainingSourceReference {
  return {
    manualId: FSI_MANUAL_ID,
    chapter: String(reference.chapter),
    section: reference.section,
    pageLabel: reference.manualPage,
  };
}

export const learjet3536NativeAbnormal: AircraftAbnormalEmergencyContent = {
  aircraftId: learjet3536AbnormalTraining.aircraftId,
  title: "Learjet 35/36 Abnormal & Emergency Training",
  sourceNote: "Native abnormal/emergency training migrated from the reviewed FlightSafety Learjet 35/36 Pilot Training Manual, Revision 1.1 source-backed content. Technical source locations are retained at every stage.",
  disclaimer: "Training/familiarization content only. The applicable AFM, approved supplements, operator SOPs and regulatory publications remain controlling and take precedence if they differ from this training material.",
  scenarios: learjet3536AbnormalTraining.scenarios.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    category: scenario.category,
    phase: scenario.phase,
    difficulty: scenario.difficulty,
    minutes: scenario.minutes,
    summary: realStandardTrainingText(scenario.summary),
    setup: realStandardTrainingText(scenario.setup),
    objectives: scenario.objectives.map(realStandardTrainingText),
    debrief: scenario.debrief.map(realStandardTrainingText),
    boundaryNote: scenario.trainingBoundary ? realStandardTrainingText(scenario.trainingBoundary) : undefined,
    applicability: scenario.variantNote
      ? { note: realStandardTrainingText(scenario.variantNote) }
      : undefined,
    stages: scenario.stages.map((stage) => ({
      id: stage.id,
      label: stageLabels[stage.id] ?? stage.id,
      prompt: realStandardTrainingText(stage.prompt),
      expectedResponse: stage.expectedResponse.map(realStandardTrainingText),
      explanation: realStandardTrainingText(stage.why),
      sources: stage.source.map(source),
    })),
  })),
};
