import type { AircraftAbnormalTraining } from "./abnormal-scenarios";
import type { TrainingAircraft } from "./aircraft-catalog";
import type { CockpitOrientation } from "./cockpit-orientation";
import type { AircraftLearningContent } from "./learning-content";
import type { SimulatorFlightFlow } from "./simulator-checklists";

export type AircraftContentCapabilities = {
  readonly quickStart: boolean;
  readonly systems: boolean;
  readonly normalFlight: boolean;
  readonly cockpitOrientation: boolean;
  readonly abnormalEmergency: boolean;
  readonly manual: boolean;
};

export type AircraftContentBundle = {
  readonly aircraft: TrainingAircraft;
  readonly learningContent?: AircraftLearningContent;
  readonly normalFlight?: SimulatorFlightFlow;
  readonly cockpitOrientation?: CockpitOrientation;
  readonly abnormalTraining?: AircraftAbnormalTraining;
  readonly capabilities: AircraftContentCapabilities;
};

/**
 * Aircraft-specific training content is accessed through this async boundary.
 *
 * The current v1.0 reference implementation uses a static adapter while the
 * content schema is stabilised. A PostgreSQL adapter can replace that adapter
 * without changing learner-facing pages or client components.
 */
export interface TrainingContentRepository {
  listAircraft(): Promise<readonly TrainingAircraft[]>;
  getAircraft(aircraftId: string): Promise<TrainingAircraft | undefined>;
  getLearningContent(aircraftId: string): Promise<AircraftLearningContent | undefined>;
  getNormalFlight(aircraftId: string): Promise<SimulatorFlightFlow | undefined>;
  getCockpitOrientation(aircraftId: string): Promise<CockpitOrientation | undefined>;
  getAbnormalTraining(aircraftId: string): Promise<AircraftAbnormalTraining | undefined>;
}

export async function getAircraftContentBundle(
  repository: TrainingContentRepository,
  aircraftId: string,
): Promise<AircraftContentBundle | undefined> {
  const [
    aircraft,
    learningContent,
    normalFlight,
    cockpitOrientation,
    abnormalTraining,
  ] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getLearningContent(aircraftId),
    repository.getNormalFlight(aircraftId),
    repository.getCockpitOrientation(aircraftId),
    repository.getAbnormalTraining(aircraftId),
  ]);

  if (!aircraft) return undefined;

  return {
    aircraft,
    learningContent,
    normalFlight,
    cockpitOrientation,
    abnormalTraining,
    capabilities: {
      quickStart: Boolean(learningContent?.quickStart.length),
      systems: Boolean(learningContent?.systems.length),
      normalFlight: Boolean(normalFlight),
      cockpitOrientation: Boolean(cockpitOrientation),
      abnormalEmergency: Boolean(abnormalTraining?.scenarios.length),
      manual: aircraft.manuals.length > 0,
    },
  };
}
