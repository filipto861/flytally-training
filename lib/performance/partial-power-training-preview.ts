import aeroncaExtractJson from "../../aircraft-data/learjet-35a/performance/source-extracts/partial-power-n1-aeronca.json";

import {
  evaluateLearjet35aAeroncaPartialPower,
  type Learjet35aAeroncaPartialPowerResult,
  type Learjet35aPartialPowerEligibility,
} from "../../aircraft-data/learjet-35a/performance/partial-power-adapter.ts";
import type { RunwayDeclaredDistances } from "../aviation/declared-distances.ts";
import type { PilotTakeoffCalculatorDefinition } from "../pilot-takeoff-calculator.ts";
import type { PerformanceDataset } from "../universal-aircraft-content.ts";
import type { PartialPowerN1SourceExtract } from "./partial-power-source.ts";

export type TakeoffThrustMode = "full-rated" | "partial-power";

export type PartialPowerThrustReverserConfiguration =
  | "unknown"
  | "none"
  | "aeronca"
  | "tr4000";

export type PartialPowerTrainingPreviewRequest = {
  readonly aircraftId: string;
  readonly datasets: readonly PerformanceDataset[];
  readonly definition?: PilotTakeoffCalculatorDefinition;
  readonly pressureAltitudeFt: number;
  readonly ambientTemperatureC: number;
  readonly takeoffWeightLb: number;
  readonly flaps: string;
  readonly runwayWindComponentKt: number;
  readonly declaredDistances: RunwayDeclaredDistances;
  readonly eligibility: Learjet35aPartialPowerEligibility;
  readonly thrustReversers: PartialPowerThrustReverserConfiguration;
};

export type PartialPowerTrainingPreviewResult =
  | Learjet35aAeroncaPartialPowerResult
  | {
      readonly status: "unsupported";
      readonly reason: string;
    };

const aeroncaExtract = aeroncaExtractJson as PartialPowerN1SourceExtract;

/**
 * Source-gated training preview boundary for Partial Power.
 *
 * This is intentionally separate from the normal operational Takeoff result.
 * It may expose a source-supported calculation while the independent 25% rated
 * takeoff-thrust requirement is unresolved, but it must never be persisted or
 * rendered as an operationally accepted result.
 */
export function evaluatePartialPowerTrainingPreview(
  request: PartialPowerTrainingPreviewRequest,
): PartialPowerTrainingPreviewResult {
  if (request.aircraftId !== "learjet-35a") {
    return {
      status: "unsupported",
      reason: "Partial Power preview is not available for this aircraft package.",
    };
  }

  if (!request.definition) {
    return {
      status: "unsupported",
      reason: "Takeoff calculator definition is unavailable.",
    };
  }

  if (request.thrustReversers === "unknown") {
    return {
      status: "unsupported",
      reason: "Select the installed thrust-reverser configuration before evaluating Partial Power.",
    };
  }

  if (request.thrustReversers !== "aeronca") {
    return {
      status: "unsupported",
      reason:
        request.thrustReversers === "tr4000"
          ? "TR-4000 Partial Power remains source-limited and is not enabled."
          : "Partial Power without thrust reversers remains blocked on unresolved source semantics.",
    };
  }

  if (request.flaps !== "8" && request.flaps !== "20") {
    return {
      status: "unsupported",
      reason: "Selected flap configuration is not supported by the Learjet Partial Power adapter.",
    };
  }

  return evaluateLearjet35aAeroncaPartialPower(
    request.datasets,
    request.definition,
    aeroncaExtract,
    {
      pressureAltitudeFt: request.pressureAltitudeFt,
      ambientTemperatureC: request.ambientTemperatureC,
      takeoffWeightLb: request.takeoffWeightLb,
      flaps: request.flaps,
      runwayWindComponentKt: request.runwayWindComponentKt,
      declaredDistances: request.declaredDistances,
      eligibility: request.eligibility,
    },
  );
}
