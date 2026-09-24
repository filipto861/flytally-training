export type AssumedTemperatureEligibilityCheck = {
  readonly key: string;
  readonly label: string;
  readonly satisfied: boolean;
  readonly reason?: string;
};

export type AssumedTemperatureCandidate = {
  readonly temperature: number;
  readonly performanceWeightLimit: number;
  readonly correctedTakeoffDistance: number;
  readonly v1: number;
  readonly sourceDatasetIds: readonly string[];
};

export type AssumedTemperatureSolverRequest = {
  readonly temperatureUnit: "F" | "C";
  readonly distanceUnit: "FT";
  readonly weightUnit: "LB";
  readonly ambientTemperature: number;
  readonly takeoffWeight: number;
  readonly ambientPerformanceWeightLimit: number;
  readonly tora: number;
  readonly asda: number;
  readonly eligibilityChecks: readonly AssumedTemperatureEligibilityCheck[];
  /**
   * Candidates are explicit source-supported evaluations supplied by the
   * aircraft adapter. The generic solver never invents intermediate
   * temperatures or extrapolates beyond this list.
   */
  readonly candidates: readonly AssumedTemperatureCandidate[];
};

export type AssumedTemperatureSolverResult =
  | {
      readonly status: "invalid";
      readonly errors: readonly string[];
    }
  | {
      readonly status: "ineligible";
      readonly failedChecks: readonly AssumedTemperatureEligibilityCheck[];
    }
  | {
      readonly status: "no-solution";
      readonly reason:
        | "ambient-weight-limit"
        | "no-reduced-thrust-candidate"
        | "no-runway-and-weight-feasible-candidate";
      readonly usableTakeoffFieldLength: number;
    }
  | {
      readonly status: "ready";
      readonly assumedTemperature: number;
      readonly ambientTemperature: number;
      readonly usableTakeoffFieldLength: number;
      readonly limitingDeclaredDistance: "TORA" | "ASDA" | "BOTH";
      readonly ambientPerformanceWeightLimit: number;
      readonly assumedPerformanceWeightLimit: number;
      readonly correctedTakeoffDistance: number;
      readonly v1: number;
      readonly sourceDatasetIds: readonly string[];
    };

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function positiveFinite(value: unknown): value is number {
  return finite(value) && value > 0;
}

function uniqueNonEmptyStrings(values: readonly string[]): boolean {
  return (
    values.length > 0
    && values.every((value) => value.trim().length > 0)
    && new Set(values).size === values.length
  );
}

export function validateAssumedTemperatureSolverRequest(
  request: AssumedTemperatureSolverRequest,
): readonly string[] {
  const errors: string[] = [];

  if (!finite(request.ambientTemperature)) {
    errors.push("Ambient temperature must be finite.");
  }
  if (!positiveFinite(request.takeoffWeight)) {
    errors.push("Takeoff weight must be a positive finite value.");
  }
  if (!positiveFinite(request.ambientPerformanceWeightLimit)) {
    errors.push("Ambient performance weight limit must be a positive finite value.");
  }
  if (!positiveFinite(request.tora)) {
    errors.push("TORA must be a positive finite distance.");
  }
  if (!positiveFinite(request.asda)) {
    errors.push("ASDA must be a positive finite distance.");
  }

  if (!Array.isArray(request.eligibilityChecks)) {
    errors.push("Eligibility checks are required.");
  } else {
    request.eligibilityChecks.forEach((check, index) => {
      if (!check.key.trim()) errors.push(`eligibilityChecks[${index}].key is required.`);
      if (!check.label.trim()) errors.push(`eligibilityChecks[${index}].label is required.`);
      if (check.reason !== undefined && !check.reason.trim()) {
        errors.push(`eligibilityChecks[${index}].reason must be non-empty when supplied.`);
      }
    });
  }

  if (!Array.isArray(request.candidates)) {
    errors.push("Assumed-temperature candidates are required.");
    return errors;
  }

  const temperatures = new Set<number>();
  request.candidates.forEach((candidate, index) => {
    if (!finite(candidate.temperature)) {
      errors.push(`candidates[${index}].temperature must be finite.`);
    } else if (temperatures.has(candidate.temperature)) {
      errors.push(`candidates[${index}] duplicates assumed temperature ${candidate.temperature}.`);
    } else {
      temperatures.add(candidate.temperature);
    }

    if (!positiveFinite(candidate.performanceWeightLimit)) {
      errors.push(`candidates[${index}].performanceWeightLimit must be positive and finite.`);
    }
    if (!positiveFinite(candidate.correctedTakeoffDistance)) {
      errors.push(`candidates[${index}].correctedTakeoffDistance must be positive and finite.`);
    }
    if (!positiveFinite(candidate.v1)) {
      errors.push(`candidates[${index}].v1 must be positive and finite.`);
    }
    if (!uniqueNonEmptyStrings(candidate.sourceDatasetIds)) {
      errors.push(`candidates[${index}].sourceDatasetIds must be unique non-empty strings.`);
    }
  });

  return errors;
}

/**
 * Aircraft-agnostic assumed-temperature selector.
 *
 * The aircraft adapter is responsible for producing source-supported candidate
 * evaluations, including any governed interpolation and wind correction. This
 * selector only enforces the common reduced-thrust constraints:
 *
 * - operational eligibility checks must all pass;
 * - ambient and assumed-temperature performance weight limits must both cover
 *   actual takeoff weight;
 * - usable runway is the lower of TORA and ASDA;
 * - the selected assumed temperature must be above ambient;
 * - the highest feasible supplied candidate wins.
 *
 * No temperature is invented between supplied candidates and no extrapolation
 * is performed here.
 */
export function solveHighestAssumedTemperature(
  request: AssumedTemperatureSolverRequest,
): AssumedTemperatureSolverResult {
  const errors = validateAssumedTemperatureSolverRequest(request);
  if (errors.length > 0) {
    return { status: "invalid", errors };
  }

  const usableTakeoffFieldLength = Math.min(request.tora, request.asda);
  const limitingDeclaredDistance =
    request.tora === request.asda
      ? "BOTH"
      : request.tora < request.asda
        ? "TORA"
        : "ASDA";

  const failedChecks = request.eligibilityChecks.filter((check) => !check.satisfied);
  if (failedChecks.length > 0) {
    return {
      status: "ineligible",
      failedChecks,
    };
  }

  if (request.ambientPerformanceWeightLimit < request.takeoffWeight) {
    return {
      status: "no-solution",
      reason: "ambient-weight-limit",
      usableTakeoffFieldLength,
    };
  }

  const reducedThrustCandidates = request.candidates.filter(
    (candidate) => candidate.temperature > request.ambientTemperature,
  );
  if (reducedThrustCandidates.length === 0) {
    return {
      status: "no-solution",
      reason: "no-reduced-thrust-candidate",
      usableTakeoffFieldLength,
    };
  }

  const feasible = reducedThrustCandidates
    .filter((candidate) => (
      candidate.performanceWeightLimit >= request.takeoffWeight
      && candidate.correctedTakeoffDistance <= usableTakeoffFieldLength
    ))
    .sort((left, right) => right.temperature - left.temperature);

  const selected = feasible[0];
  if (!selected) {
    return {
      status: "no-solution",
      reason: "no-runway-and-weight-feasible-candidate",
      usableTakeoffFieldLength,
    };
  }

  return {
    status: "ready",
    assumedTemperature: selected.temperature,
    ambientTemperature: request.ambientTemperature,
    usableTakeoffFieldLength,
    limitingDeclaredDistance,
    ambientPerformanceWeightLimit: request.ambientPerformanceWeightLimit,
    assumedPerformanceWeightLimit: selected.performanceWeightLimit,
    correctedTakeoffDistance: selected.correctedTakeoffDistance,
    v1: selected.v1,
    sourceDatasetIds: selected.sourceDatasetIds,
  };
}
