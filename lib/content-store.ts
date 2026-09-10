import type { TrainingContentRepository } from "./content-repository";
import { PostgresTrainingContentRepository } from "./postgres-content-repository";
import { StaticTrainingContentRepository } from "./static-content-repository";

const staticRepository: TrainingContentRepository = new StaticTrainingContentRepository();
const postgresRepository: TrainingContentRepository = new PostgresTrainingContentRepository();

/** Single application composition boundary for aircraft-specific training content. */
export function getTrainingContentRepository(): TrainingContentRepository {
  return process.env.TRAINING_CONTENT_BACKEND?.trim().toLowerCase() === "postgres" ? postgresRepository : staticRepository;
}
