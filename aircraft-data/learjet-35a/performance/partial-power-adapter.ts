import {
  calculateMultiAxisMetricGrid,
  calculatePostBaselineTransform,
} from "../../../lib/performance-calculator.ts";
import {
  solveHighestAssumedTemperature,
  type AssumedTemperatureCandidate,
  type AssumedTemperatureSolverResult,
} from "../../../lib/performance/assumed-temperature.ts";
import {
  resolveTakeoffDeclaredDistanceConstraint,
  type RunwayDeclaredDistances,
} from "../../../lib/aviation/declared-distances.ts";
import type { PerformanceDataset } from "../../../lib/universal-aircraft-content.ts";
import type { PilotTakeoffCalculatorDefinition } from "../../../lib/pilot-takeoff-calculator.ts";

export type Learjet35aPartialPowerEligibility = {
  readonly runwayDryHardPaved: boolean;
  readonly antiIce: boolean;
  readonly antiSkidOperative: boolean;
  readonly fullRatedTakeoffWithin30Days: boolean;
};

export type Learjet35aAssumedTemperatureRequest = {
  readonly pressureAltitudeFt: number;
  readonly ambientTemperatureC: number;
  readonly takeoffWeightLb: number;
  readonly flaps: "8" | "20";
  readonly runwayWindComponentKt: number;
  readonly declaredDistances: RunwayDeclaredDistances;
  readonly eligibility: Learjet35aPartialPowerEligibility;
};

export type Learjet35aAssumedTemperatureAdapterResult =
  | AssumedTemperatureSolverResult
  | {
      readonly status: "unsupported";
      readonly reason: string;
    };

const WEIGHT_LIMIT_DATASET_BY_FLAPS = {
  "8": "learjet-35a-takeoff-weight-limit-flaps8",
  "20": "learjet-35a-takeoff-weight-limit-flaps20",
} as const;

function datasetById(
  datasets: readonly PerformanceDataset[],
  id: string,
): PerformanceDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}

function numericMetric(
  dataset: PerformanceDataset,
  inputs: Readonly<Record<string, number>>,
  key: string,
): number | undefined {
  const result = calculateMultiAxisMetricGrid(dataset, inputs);
  if (result.status !== "ready") return undefined;
  const value = result.metrics?.find((metric) => metric.key === key)?.value;
  return typeof value === "number" ? value : undefined;
}

function numericAxisValues(
  dataset: PerformanceDataset,
  key: string,
): readonly number[] {
  const axis = dataset.axes.find((candidate) => candidate.key === key);
  if (!axis) return [];
  return axis.values.filter((value): value is number => typeof value === "number");
}

function correctedMetric(
  baseline: number,
  transform: PerformanceDataset | undefined,
  windComponentKt: number,
): number | undefined {
  if (!transform) {
    return Math.abs(windComponentKt) < 1e-9 ? baseline : undefined;
  }
  const result = calculatePostBaselineTransform(
    transform,
    baseline,
    windComponentKt,
  );
  return result.status === "ready" && typeof result.value === "number"
    ? result.value
    : undefined;
}

function uniqueIds(ids: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * Learjet 35A/36A adapter that builds source-supported assumed-temperature
 * candidates for the generic selector.
 *
 * This adapter does not calculate reduced N1. The P-6/P-6.1 parenthesized N1
 * semantics remain unresolved, so operational Partial Power N1 stays blocked.
 */
export function solveLearjet35aAssumedTemperature(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition,
  request: Learjet35aAssumedTemperatureRequest,
): Learjet35aAssumedTemperatureAdapterResult {
  const declared = resolveTakeoffDeclaredDistanceConstraint(
    request.declaredDistances,
  );
  if (declared.status === "missing") {
    return {
      status: "unsupported",
      reason: `Declared distance unavailable: missing ${declared.missing.join(" + ")}.`,
    };
  }
  if (declared.status === "invalid") {
    return {
      status: "unsupported",
      reason: declared.errors.join(" "),
    };
  }

  const flap = definition.flapOptions.find(
    (candidate) => candidate.value === request.flaps,
  );
  if (!flap) {
    return {
      status: "unsupported",
      reason: "Selected takeoff flap configuration is unavailable.",
    };
  }

  const weightLimitId = WEIGHT_LIMIT_DATASET_BY_FLAPS[request.flaps];
  const weightLimitDataset = datasetById(datasets, weightLimitId);
  const distanceBinding = flap.takeoffDistance?.antiIceOff;
  const v1Binding = flap.v1?.antiIceOff;
  if (!weightLimitDataset || !distanceBinding || !v1Binding) {
    return {
      status: "unsupported",
      reason: "Required Partial Power prerequisite source dataset is unavailable.",
    };
  }

  const distanceDataset = datasetById(datasets, distanceBinding.datasetId);
  const v1Dataset = datasetById(datasets, v1Binding.datasetId);
  if (!distanceDataset || !v1Dataset) {
    return {
      status: "unsupported",
      reason: "Required Takeoff Speeds & Distances source dataset is unavailable.",
    };
  }

  const distanceWindId = flap.windCorrection?.takeoffDistance?.datasetId;
  const v1WindId = flap.windCorrection?.v1?.datasetId;
  const distanceWindDataset = distanceWindId
    ? datasetById(datasets, distanceWindId)
    : undefined;
  const v1WindDataset = v1WindId
    ? datasetById(datasets, v1WindId)
    : undefined;

  if (
    Math.abs(request.runwayWindComponentKt) >= 1e-9
    && (!distanceWindId || !v1WindId)
  ) {
    return {
      status: "unsupported",
      reason: `No source-backed nonzero-wind Partial Power correction is available for Flaps ${request.flaps}°.`,
    };
  }
  if (
    (distanceWindId && !distanceWindDataset)
    || (v1WindId && !v1WindDataset)
  ) {
    return {
      status: "unsupported",
      reason: "Declared wind-correction source dataset is unavailable.",
    };
  }

  const ambientPerformanceWeightLimit = numericMetric(
    weightLimitDataset,
    {
      pressureAltitude: request.pressureAltitudeFt,
      oat: request.ambientTemperatureC,
    },
    "maxTakeoffWeight",
  );
  if (ambientPerformanceWeightLimit === undefined) {
    return {
      status: "unsupported",
      reason: "Ambient takeoff-weight limitation is outside the source-supported region.",
    };
  }

  const candidateTemperatures = numericAxisValues(
    weightLimitDataset,
    "oat",
  )
    .filter((temperature) => temperature > request.ambientTemperatureC)
    .sort((left, right) => left - right);

  const candidates: AssumedTemperatureCandidate[] = [];
  for (const temperature of candidateTemperatures) {
    const performanceWeightLimit = numericMetric(
      weightLimitDataset,
      {
        pressureAltitude: request.pressureAltitudeFt,
        oat: temperature,
      },
      "maxTakeoffWeight",
    );
    const baselineDistance = numericMetric(
      distanceDataset,
      {
        pressureAltitude: request.pressureAltitudeFt,
        oat: temperature,
        grossWeight: request.takeoffWeightLb,
      },
      distanceBinding.outputKey,
    );
    const baselineV1 = numericMetric(
      v1Dataset,
      {
        pressureAltitude: request.pressureAltitudeFt,
        oat: temperature,
        grossWeight: request.takeoffWeightLb,
      },
      v1Binding.outputKey,
    );

    if (
      performanceWeightLimit === undefined
      || baselineDistance === undefined
      || baselineV1 === undefined
    ) continue;

    const correctedTakeoffDistance = correctedMetric(
      baselineDistance,
      distanceWindDataset,
      request.runwayWindComponentKt,
    );
    const v1 = correctedMetric(
      baselineV1,
      v1WindDataset,
      request.runwayWindComponentKt,
    );
    if (correctedTakeoffDistance === undefined || v1 === undefined) continue;

    candidates.push({
      temperature,
      performanceWeightLimit,
      correctedTakeoffDistance,
      v1,
      sourceDatasetIds: uniqueIds([
        weightLimitDataset.id,
        distanceDataset.id,
        v1Dataset.id,
        distanceWindDataset?.id,
        v1WindDataset?.id,
      ]),
    });
  }

  if (
    candidateTemperatures.length > 0
    && candidates.length === 0
  ) {
    return {
      status: "unsupported",
      reason: "No complete source-supported assumed-temperature candidate is available for the selected conditions.",
    };
  }

  return solveHighestAssumedTemperature({
    temperatureUnit: "C",
    distanceUnit: "FT",
    weightUnit: "LB",
    ambientTemperature: request.ambientTemperatureC,
    takeoffWeight: request.takeoffWeightLb,
    ambientPerformanceWeightLimit,
    tora: declared.toraFt,
    asda: declared.asdaFt,
    eligibilityChecks: [
      {
        key: "dry-hard-paved",
        label: "Dry hard-paved runway",
        satisfied: request.eligibility.runwayDryHardPaved,
        reason: request.eligibility.runwayDryHardPaved
          ? undefined
          : "Reduced thrust is limited to a hard-paved, dry runway.",
      },
      {
        key: "anti-ice-off",
        label: "Bleed-air anti-ice OFF",
        satisfied: !request.eligibility.antiIce,
        reason: request.eligibility.antiIce
          ? "Reduced thrust is unavailable with bleed-air anti-ice ON."
          : undefined,
      },
      {
        key: "anti-skid-operative",
        label: "Anti-skid operative",
        satisfied: request.eligibility.antiSkidOperative,
        reason: request.eligibility.antiSkidOperative
          ? undefined
          : "Reduced thrust requires anti-skid ON and operative.",
      },
      {
        key: "recent-full-rated-takeoff",
        label: "Full rated-thrust takeoff within preceding 30 days",
        satisfied: request.eligibility.fullRatedTakeoffWithin30Days,
        reason: request.eligibility.fullRatedTakeoffWithin30Days
          ? undefined
          : "A full rated-thrust takeoff is required within the preceding 30 days.",
      },
    ],
    candidates,
  });
}
