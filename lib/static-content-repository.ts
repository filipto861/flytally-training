import { learjet3536AbnormalTraining, type AircraftAbnormalTraining } from "./abnormal-scenarios";
import { trainingAircraft, type TrainingAircraft } from "./aircraft-catalog";
import { learjet3536CockpitOrientation, type CockpitOrientation } from "./cockpit-orientation";
import type { TrainingContentRepository } from "./content-repository";
import { learjet3536LearningContent, type AircraftLearningContent } from "./learning-content";
import { learjet3536ColdDarkFlow, type SimulatorFlightFlow } from "./simulator-checklists";

export type StaticTrainingContentSeed = {
  readonly aircraft: readonly TrainingAircraft[];
  readonly learningContent: readonly AircraftLearningContent[];
  readonly normalFlights: readonly SimulatorFlightFlow[];
  readonly cockpitOrientations: readonly CockpitOrientation[];
  readonly abnormalTrainings: readonly AircraftAbnormalTraining[];
};

export const staticTrainingContentSeed: StaticTrainingContentSeed = {
  aircraft: trainingAircraft,
  learningContent: [learjet3536LearningContent],
  normalFlights: [learjet3536ColdDarkFlow],
  cockpitOrientations: [learjet3536CockpitOrientation],
  abnormalTrainings: [learjet3536AbnormalTraining],
};

/**
 * Temporary repository adapter for content that still lives in source files.
 *
 * Importantly, lookup behaviour is aircraft-agnostic: adding another seed entry
 * never requires a new if/switch branch. This adapter is intentionally behind
 * the same async contract planned for PostgreSQL.
 */
export class StaticTrainingContentRepository implements TrainingContentRepository {
  private readonly aircraftById: ReadonlyMap<string, TrainingAircraft>;
  private readonly learningByAircraftId: ReadonlyMap<string, AircraftLearningContent>;
  private readonly normalFlightByAircraftId: ReadonlyMap<string, SimulatorFlightFlow>;
  private readonly orientationByAircraftId: ReadonlyMap<string, CockpitOrientation>;
  private readonly abnormalByAircraftId: ReadonlyMap<string, AircraftAbnormalTraining>;

  constructor(seed: StaticTrainingContentSeed = staticTrainingContentSeed) {
    this.aircraftById = new Map(seed.aircraft.map((item) => [item.id, item] as const));
    this.learningByAircraftId = new Map(seed.learningContent.map((item) => [item.aircraftId, item] as const));
    this.normalFlightByAircraftId = new Map(seed.normalFlights.map((item) => [item.aircraftId, item] as const));
    this.orientationByAircraftId = new Map(seed.cockpitOrientations.map((item) => [item.aircraftId, item] as const));
    this.abnormalByAircraftId = new Map(seed.abnormalTrainings.map((item) => [item.aircraftId, item] as const));
  }

  async listAircraft(): Promise<readonly TrainingAircraft[]> {
    return [...this.aircraftById.values()];
  }

  async getAircraft(aircraftId: string): Promise<TrainingAircraft | undefined> {
    return this.aircraftById.get(aircraftId);
  }

  async getLearningContent(aircraftId: string): Promise<AircraftLearningContent | undefined> {
    return this.learningByAircraftId.get(aircraftId);
  }

  async getNormalFlight(aircraftId: string): Promise<SimulatorFlightFlow | undefined> {
    return this.normalFlightByAircraftId.get(aircraftId);
  }

  async getCockpitOrientation(aircraftId: string): Promise<CockpitOrientation | undefined> {
    return this.orientationByAircraftId.get(aircraftId);
  }

  async getAbnormalTraining(aircraftId: string): Promise<AircraftAbnormalTraining | undefined> {
    return this.abnormalByAircraftId.get(aircraftId);
  }
}
