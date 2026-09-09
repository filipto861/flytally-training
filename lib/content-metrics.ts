import type { AircraftAbnormalTraining } from "./abnormal-scenarios";
import type { AircraftLearningContent } from "./learning-content";

export function getQuickStartMinutes(content: AircraftLearningContent): number {
  return content.quickStart.reduce((sum, topic) => sum + topic.minutes, 0);
}

export function getEssentialSystemsMinutes(content: AircraftLearningContent): number {
  return content.systems.reduce((sum, lesson) => sum + lesson.minutes, 0);
}

export function getAbnormalTrainingMinutes(training: AircraftAbnormalTraining): number {
  return training.scenarios.reduce((total, scenario) => total + scenario.minutes, 0);
}
