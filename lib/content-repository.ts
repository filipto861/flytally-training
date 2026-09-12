import type { AircraftAbnormalTraining } from "./abnormal-scenarios";
import type { TrainingAircraft } from "./aircraft-catalog";
import type { CockpitOrientation } from "./cockpit-orientation";
import type { TrainingContentDomain } from "./content-admin-types";
import type { AircraftLearningContent } from "./learning-content";
import type { AircraftReferenceKnowledge } from "./reference-knowledge";
import type { SimulatorFlightFlow } from "./simulator-checklists";

export type AircraftContentCapabilities = {
  readonly checklists: boolean;
  readonly procedures: boolean;
  readonly performance: boolean;
  readonly weightBalance: boolean;
  readonly limitations: boolean;
  readonly systems: boolean;
  readonly abnormalEmergency: boolean;
  readonly flows: boolean;
  readonly avionics: boolean;
  readonly knowledge: boolean;
  readonly manual: boolean;

  // Legacy migration capabilities kept only while older governed payload shapes
  // remain readable. New aircraft use the universal first-class domains.
  readonly quickStart: boolean;
  readonly normalFlight: boolean;
  readonly cockpitOrientation: boolean;
  readonly quickReference: boolean;
};

export type AircraftContentBundle = {
  readonly aircraft: TrainingAircraft;
  readonly learningContent?: AircraftLearningContent;
  readonly normalFlight?: SimulatorFlightFlow;
  readonly cockpitOrientation?: CockpitOrientation;
  readonly abnormalTraining?: AircraftAbnormalTraining;
  readonly referenceKnowledge?: AircraftReferenceKnowledge;
  readonly publishedModuleDomains: readonly TrainingContentDomain[];
  readonly capabilities: AircraftContentCapabilities;
};

export interface TrainingContentRepository {
  listAircraft(): Promise<readonly TrainingAircraft[]>;
  getAircraft(aircraftId: string): Promise<TrainingAircraft | undefined>;
  getLearningContent(aircraftId: string): Promise<AircraftLearningContent | undefined>;
  getNormalFlight(aircraftId: string): Promise<SimulatorFlightFlow | undefined>;
  getCockpitOrientation(aircraftId: string): Promise<CockpitOrientation | undefined>;
  getAbnormalTraining(aircraftId: string): Promise<AircraftAbnormalTraining | undefined>;
  getReferenceKnowledge(aircraftId: string): Promise<AircraftReferenceKnowledge | undefined>;
  listPublishedModuleDomains?(aircraftId: string): Promise<readonly TrainingContentDomain[]>;
  getPublishedModule?<T>(aircraftId: string, domain: TrainingContentDomain, contentKey?: string): Promise<T | undefined>;
}

export async function getPublishedAircraftModule<T>(
  repository: TrainingContentRepository,
  aircraftId: string,
  domain: TrainingContentDomain,
  contentKey = "bundle",
): Promise<T | undefined> {
  return repository.getPublishedModule?.<T>(aircraftId, domain, contentKey);
}

export async function getAircraftContentBundle(
  repository: TrainingContentRepository,
  aircraftId: string,
): Promise<AircraftContentBundle | undefined> {
  const moduleDomainsPromise = repository.listPublishedModuleDomains
    ? repository.listPublishedModuleDomains(aircraftId)
    : Promise.resolve([] as readonly TrainingContentDomain[]);

  const [aircraft, learningContent, normalFlight, cockpitOrientation, abnormalTraining, referenceKnowledge, publishedModuleDomains] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getLearningContent(aircraftId),
    repository.getNormalFlight(aircraftId),
    repository.getCockpitOrientation(aircraftId),
    repository.getAbnormalTraining(aircraftId),
    repository.getReferenceKnowledge(aircraftId),
    moduleDomainsPromise,
  ]);

  if (!aircraft) return undefined;

  const published = new Set<TrainingContentDomain>(publishedModuleDomains);
  const legacySystems = Boolean(learningContent?.systems.length);
  const legacyChecklist = Boolean(normalFlight?.phases.length);
  const legacyKnowledge = Boolean(referenceKnowledge?.questions.length);

  return {
    aircraft,
    learningContent,
    normalFlight,
    cockpitOrientation,
    abnormalTraining,
    referenceKnowledge,
    publishedModuleDomains,
    capabilities: {
      checklists: published.has("checklists") || legacyChecklist,
      procedures: published.has("procedures"),
      performance: published.has("performance"),
      weightBalance: published.has("weight-balance"),
      limitations: published.has("limitations"),
      systems: published.has("systems") || legacySystems,
      abnormalEmergency: published.has("abnormal") || Boolean(abnormalTraining?.scenarios.length),
      flows: published.has("flows"),
      avionics: published.has("avionics"),
      knowledge: published.has("knowledge") || legacyKnowledge,
      manual: aircraft.manuals.length > 0,
      quickStart: Boolean(learningContent?.quickStart.length),
      normalFlight: Boolean(normalFlight),
      cockpitOrientation: Boolean(cockpitOrientation),
      quickReference: Boolean(referenceKnowledge?.groups.length),
    },
  };
}
