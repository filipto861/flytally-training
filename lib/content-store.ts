import type { TrainingContentRepository } from "./content-repository";
import { PostgresTrainingContentRepository } from "./postgres-content-repository";
import { StaticTrainingContentRepository } from "./static-content-repository";
import { browserTrainingContentSeed,browserTrainingFixtureEnabled } from "./browser-training-fixture";

const staticRepository: TrainingContentRepository = new StaticTrainingContentRepository();
const browserRepository: TrainingContentRepository = new StaticTrainingContentRepository(browserTrainingContentSeed);
const postgresRepository: TrainingContentRepository = new PostgresTrainingContentRepository();

/** Single application composition boundary for aircraft-specific training content. */
export function getTrainingContentRepository(): TrainingContentRepository {
  if(browserTrainingFixtureEnabled())return browserRepository;
  return process.env.TRAINING_CONTENT_BACKEND?.trim().toLowerCase() === "postgres" ? postgresRepository : staticRepository;
}
