import type { TrainingContentRepository } from "./content-repository";
import { StaticTrainingContentRepository } from "./static-content-repository";

const trainingContentRepository: TrainingContentRepository = new StaticTrainingContentRepository();

/**
 * Single application entry point for aircraft-specific training content.
 *
 * Learner-facing code must consume this repository instead of importing
 * aircraft-specific registries directly. When PostgreSQL content persistence
 * lands, only this composition boundary should need to choose the new adapter.
 */
export function getTrainingContentRepository(): TrainingContentRepository {
  return trainingContentRepository;
}
