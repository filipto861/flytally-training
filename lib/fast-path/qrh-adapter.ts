import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../aircraft-applicability.ts";
import {
  toOperationalEmergency,
  type OperationalEmergencyContent,
} from "../operational-flight-data.ts";
import { isUniversalAbnormalEmergencyContent } from "../universal-abnormal-emergency.ts";

export function resolveFastPathQrh(
  payload: unknown,
  configuration: AircraftConfiguration,
  ready: boolean,
): OperationalEmergencyContent | undefined {
  if (!ready || !isUniversalAbnormalEmergencyContent(payload)) return undefined;

  const configured = filterAbnormalEmergencyForConfiguration(
    payload,
    configuration,
  );
  if (!configured.scenarios.length) return undefined;

  return toOperationalEmergency(configured);
}
