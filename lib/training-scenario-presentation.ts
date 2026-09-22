import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "./aircraft-applicability.ts";
import {
  normalizeUniversalAbnormalEmergency,
  type RuntimeAbnormalTraining,
} from "./abnormal-runtime.ts";
import {
  isUniversalAbnormalEmergencyContent,
  type AircraftAbnormalEmergencyContent,
} from "./universal-abnormal-emergency.ts";

export function resolveTrainingScenarioContent(
  payload: unknown,
  configuration: AircraftConfiguration,
): RuntimeAbnormalTraining | undefined {
  if (!isUniversalAbnormalEmergencyContent(payload)) return undefined;

  const configured = filterAbnormalEmergencyForConfiguration(
    payload as AircraftAbnormalEmergencyContent,
    configuration,
  );
  if (!configured.scenarios.length) return undefined;

  return normalizeUniversalAbnormalEmergency(configured);
}
