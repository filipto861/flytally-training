import { learjet3536AbnormalTraining, type AircraftAbnormalTraining } from "./abnormal-scenarios.ts";
import { trainingAircraft, type TrainingAircraft } from "./aircraft-catalog.ts";
import { learjet3536CockpitOrientation, type CockpitOrientation } from "./cockpit-orientation.ts";
import type { TrainingContentDomain } from "./content-admin-types.ts";
import type { TrainingContentRepository } from "./content-repository.ts";
import { learjet3536LearningContent, type AircraftLearningContent } from "./learning-content.ts";
import { learjet3536ReferenceKnowledge, type AircraftReferenceKnowledge } from "./reference-knowledge.ts";
import { learjet3536ColdDarkFlow, type SimulatorFlightFlow } from "./simulator-checklists.ts";

export type StaticTrainingContentSeed = {
  readonly aircraft: readonly TrainingAircraft[];
  readonly learningContent: readonly AircraftLearningContent[];
  readonly normalFlights: readonly SimulatorFlightFlow[];
  readonly cockpitOrientations: readonly CockpitOrientation[];
  readonly abnormalTrainings: readonly AircraftAbnormalTraining[];
  readonly referenceKnowledge: readonly AircraftReferenceKnowledge[];
};

export const staticTrainingContentSeed: StaticTrainingContentSeed = {
  aircraft: trainingAircraft,
  learningContent: [learjet3536LearningContent],
  normalFlights: [learjet3536ColdDarkFlow],
  cockpitOrientations: [learjet3536CockpitOrientation],
  abnormalTrainings: [learjet3536AbnormalTraining],
  referenceKnowledge: [learjet3536ReferenceKnowledge],
};

export class StaticTrainingContentRepository implements TrainingContentRepository {
  private readonly aircraftById: ReadonlyMap<string, TrainingAircraft>;
  private readonly learningByAircraftId: ReadonlyMap<string, AircraftLearningContent>;
  private readonly normalFlightByAircraftId: ReadonlyMap<string, SimulatorFlightFlow>;
  private readonly orientationByAircraftId: ReadonlyMap<string, CockpitOrientation>;
  private readonly abnormalByAircraftId: ReadonlyMap<string, AircraftAbnormalTraining>;
  private readonly referenceKnowledgeByAircraftId: ReadonlyMap<string, AircraftReferenceKnowledge>;

  constructor(seed: StaticTrainingContentSeed = staticTrainingContentSeed) {
    this.aircraftById = new Map(seed.aircraft.map((item) => [item.id, item] as const));
    this.learningByAircraftId = new Map(seed.learningContent.map((item) => [item.aircraftId, item] as const));
    this.normalFlightByAircraftId = new Map(seed.normalFlights.map((item) => [item.aircraftId, item] as const));
    this.orientationByAircraftId = new Map(seed.cockpitOrientations.map((item) => [item.aircraftId, item] as const));
    this.abnormalByAircraftId = new Map(seed.abnormalTrainings.map((item) => [item.aircraftId, item] as const));
    this.referenceKnowledgeByAircraftId = new Map(seed.referenceKnowledge.map((item) => [item.aircraftId, item] as const));
  }

  async listAircraft(): Promise<readonly TrainingAircraft[]> { return [...this.aircraftById.values()]; }
  async getAircraft(aircraftId: string): Promise<TrainingAircraft | undefined> { return this.aircraftById.get(aircraftId); }
  async getLearningContent(aircraftId: string): Promise<AircraftLearningContent | undefined> { return this.learningByAircraftId.get(aircraftId); }
  async getNormalFlight(aircraftId: string): Promise<SimulatorFlightFlow | undefined> { return this.normalFlightByAircraftId.get(aircraftId); }
  async getCockpitOrientation(aircraftId: string): Promise<CockpitOrientation | undefined> { return this.orientationByAircraftId.get(aircraftId); }
  async getAbnormalTraining(aircraftId: string): Promise<AircraftAbnormalTraining | undefined> { return this.abnormalByAircraftId.get(aircraftId); }
  async getReferenceKnowledge(aircraftId: string): Promise<AircraftReferenceKnowledge | undefined> { return this.referenceKnowledgeByAircraftId.get(aircraftId); }

  async listPublishedModuleDomains(aircraftId: string): Promise<readonly TrainingContentDomain[]> {
    const domains: TrainingContentDomain[] = [];
    if (this.learningByAircraftId.has(aircraftId)) domains.push("learning");
    if (this.normalFlightByAircraftId.has(aircraftId)) domains.push("normal-flight");
    if (this.orientationByAircraftId.has(aircraftId)) domains.push("orientation");
    if (this.abnormalByAircraftId.has(aircraftId)) domains.push("abnormal");
    if (this.referenceKnowledgeByAircraftId.has(aircraftId)) domains.push("reference-knowledge");
    return domains;
  }

  async getPublishedModule<T>(aircraftId: string, domain: TrainingContentDomain): Promise<T | undefined> {
    if (domain === "learning") return this.learningByAircraftId.get(aircraftId) as T | undefined;
    if (domain === "normal-flight") return this.normalFlightByAircraftId.get(aircraftId) as T | undefined;
    if (domain === "orientation") return this.orientationByAircraftId.get(aircraftId) as T | undefined;
    if (domain === "abnormal") return this.abnormalByAircraftId.get(aircraftId) as T | undefined;
    if (domain === "reference-knowledge") return this.referenceKnowledgeByAircraftId.get(aircraftId) as T | undefined;
    return undefined;
  }
}
