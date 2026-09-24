import {
  calculateMultiAxisMetricGrid,
  calculatePostBaselineTransform,
} from "../../../lib/performance-calculator.ts";
import {
  solveHighestAssumedTemperature,
  type AssumedTemperatureCandidate,
  type AssumedTemperatureSolverRequest,
  type AssumedTemperatureSolverResult,
} from "../../../lib/performance/assumed-temperature.ts";
import {
  lookupPartialPowerN1SourceValue,
  type PartialPowerN1SourceValueResult,
} from "../../../lib/performance/partial-power-n1.ts";
import type {
  PartialPowerN1SourceExtract,
} from "../../../lib/performance/partial-power-source.ts";
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

type AssumedTemperatureReadyResult = Extract<
  AssumedTemperatureSolverResult,
  { status: "ready" }
>;

export type Learjet35aAeroncaPartialPowerResult =
  | Exclude<AssumedTemperatureSolverResult, { status: "ready" }>
  | {
      readonly status: "unsupported";
      readonly reason: string;
    }
  | (Omit<AssumedTemperatureReadyResult, "status"> & {
      readonly status: "source-supported";
      readonly thrustReversers: "aeronca";
      readonly reducedN1: number;
      readonly fullRatedN1: number;
      readonly n1ReductionPoints: number;
      readonly n1Method: "exact-source-cell" | "bounded-source-interpolation";
      readonly n1SourceExtractId: string;
      readonly n1SourcePageLabel: string;
      readonly operationalUseBlocked: true;
      readonly operationalBlockers: readonly [
        "rated-thrust-reduction-25-percent-unresolved",
      ];
      readonly n1InterpolationAuthority?: {
        readonly manualId: "AFMS-W1072";
        readonly figure: "5";
        readonly configuration: "aeronca";
      };
    });

const WEIGHT_LIMIT_DATASET_BY_FLAPS = {
  "8": "learjet-35a-takeoff-weight-limit-flaps8",
  "20": "learjet-35a-takeoff-weight-limit-flaps20",
} as const;

const FULL_RATED_N1_DATASET_ID =
  "learjet-35a-takeoff-n1-aeronca-anti-ice-off";

/**
 * The CL-102B weight-limit source prints paired °F/°C labels. Preserve those
 * published pairs at exact source nodes instead of round-tripping through a
 * physical conversion that would turn, for example, the published 27°C/80°F
 * node into 80.6°F.
 */
const SOURCE_FAHRENHEIT_BY_CELSIUS = new Map<number, number>([
  [-18, 0],
  [-7, 20],
  [4, 40],
  [16, 60],
  [27, 80],
  [38, 100],
]);

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

function sourceFahrenheitForCelsius(celsius: number): number {
  return SOURCE_FAHRENHEIT_BY_CELSIUS.get(celsius)
    ?? ((celsius * 9) / 5) + 32;
}

type PreparedLearjet35aAssumedTemperature =
  | {
      readonly status: "unsupported";
      readonly reason: string;
    }
  | {
      readonly status: "ready";
      readonly solverRequest: AssumedTemperatureSolverRequest;
    };

function prepareLearjet35aAssumedTemperature(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition,
  request: Learjet35aAssumedTemperatureRequest,
): PreparedLearjet35aAssumedTemperature {
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

  return {
    status: "ready",
    solverRequest: {
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
    },
  };
}

/**
 * Learjet 35A/36A adapter that builds source-supported assumed-temperature
 * candidates for the generic selector.
 *
 * This stage remains N1-free. Reduced-N1 operationalization is layered
 * separately so the already-accepted PP.2 candidate engine stays independent
 * of configuration-specific N1 source semantics.
 */
export function solveLearjet35aAssumedTemperature(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition,
  request: Learjet35aAssumedTemperatureRequest,
): Learjet35aAssumedTemperatureAdapterResult {
  const prepared = prepareLearjet35aAssumedTemperature(
    datasets,
    definition,
    request,
  );
  if (prepared.status === "unsupported") return prepared;
  return solveHighestAssumedTemperature(prepared.solverRequest);
}

type AeroncaCandidateN1 = {
  readonly candidate: AssumedTemperatureCandidate;
  readonly sourceValue: Extract<
    PartialPowerN1SourceValueResult,
    { status: "source-value" }
  >;
  readonly reductionPoints: number;
};

/**
 * Source-supported integration boundary for Aeronca-equipped Learjet 35A/36A
 * aircraft.
 *
 * It reuses the accepted PP.2 runway/weight/V1/distance candidate engine, then
 * admits only candidates whose reduced N1 is source-supported and satisfies
 * the P-6.1 maximum 7.7 N1-point reduction from the Aeronca P-5.1 full-rated
 * ambient takeoff N1.
 *
 * This function deliberately does NOT return operational "ready". FlightSafety
 * also states that thrust reduction must not exceed 25% of rated takeoff
 * thrust for the existing ambient condition. The current source package does
 * not define a validated N1-to-rated-thrust conversion for that check, so the
 * result remains source-supported with an explicit operational blocker.
 */
export function evaluateLearjet35aAeroncaPartialPower(
  datasets: readonly PerformanceDataset[],
  definition: PilotTakeoffCalculatorDefinition,
  aeroncaN1Extract: PartialPowerN1SourceExtract,
  request: Learjet35aAssumedTemperatureRequest,
): Learjet35aAeroncaPartialPowerResult {
  if (aeroncaN1Extract.configuration.thrustReversers !== "aeronca") {
    return {
      status: "unsupported",
      reason: "Aeronca Partial Power requires the Aeronca reduced-N1 source schedule.",
    };
  }

  const maxReductionPoints = aeroncaN1Extract.constraints.maxN1ReductionPoints;
  if (maxReductionPoints === null) {
    return {
      status: "unsupported",
      reason: "Aeronca reduced-N1 source does not define a maximum N1 reduction limit.",
    };
  }

  const prepared = prepareLearjet35aAssumedTemperature(
    datasets,
    definition,
    request,
  );
  if (prepared.status === "unsupported") return prepared;

  const preliminary = solveHighestAssumedTemperature(prepared.solverRequest);
  if (preliminary.status !== "ready") return preliminary;

  const fullRatedN1Dataset = datasetById(datasets, FULL_RATED_N1_DATASET_ID);
  if (!fullRatedN1Dataset) {
    return {
      status: "unsupported",
      reason: "Aeronca full-rated Takeoff N1 source dataset is unavailable.",
    };
  }

  const fullRatedN1 = numericMetric(
    fullRatedN1Dataset,
    {
      oatC: request.ambientTemperatureC,
      pressureAltitudeFt: request.pressureAltitudeFt,
    },
    "n1Percent",
  );
  if (fullRatedN1 === undefined) {
    return {
      status: "unsupported",
      reason: "Aeronca full-rated Takeoff N1 is outside the source-supported region.",
    };
  }

  const ambientTemperatureF = sourceFahrenheitForCelsius(
    request.ambientTemperatureC,
  );
  const accepted: AeroncaCandidateN1[] = [];
  let blockedN1CandidateCount = 0;

  for (const candidate of prepared.solverRequest.candidates) {
    const assumedTemperatureF = SOURCE_FAHRENHEIT_BY_CELSIUS.get(
      candidate.temperature,
    );
    if (assumedTemperatureF === undefined) {
      blockedN1CandidateCount += 1;
      continue;
    }

    const sourceValue = lookupPartialPowerN1SourceValue(
      aeroncaN1Extract,
      {
        ambientTemperatureF,
        assumedTemperatureF,
        pressureAltitudeFt: request.pressureAltitudeFt,
        antiIce: request.eligibility.antiIce,
      },
    );
    if (sourceValue.status !== "source-value") {
      blockedN1CandidateCount += 1;
      continue;
    }

    const reductionPoints = fullRatedN1 - sourceValue.reducedN1;
    if (
      reductionPoints < -1e-9
      || reductionPoints > maxReductionPoints + 1e-9
    ) {
      continue;
    }

    accepted.push({
      candidate,
      sourceValue,
      reductionPoints,
    });
  }

  if (accepted.length === 0) {
    return {
      status: "unsupported",
      reason: blockedN1CandidateCount > 0
        ? "No assumed-temperature candidate has a complete source-supported Aeronca reduced-N1 evaluation within the current source boundary."
        : `No assumed-temperature candidate satisfies the P-6.1 maximum ${maxReductionPoints.toFixed(1)} N1-point reduction limit.`,
    };
  }

  const solved = solveHighestAssumedTemperature({
    ...prepared.solverRequest,
    candidates: accepted.map(({ candidate }) => candidate),
  });
  if (solved.status !== "ready") return solved;

  const selected = accepted.find(
    ({ candidate }) => candidate.temperature === solved.assumedTemperature,
  );
  if (!selected) {
    return {
      status: "unsupported",
      reason: "Selected assumed-temperature candidate lost its Aeronca N1 source binding.",
    };
  }

  const { status: _solverStatus, ...solvedValues } = solved;

  return {
    ...solvedValues,
    status: "source-supported",
    thrustReversers: "aeronca",
    reducedN1: selected.sourceValue.reducedN1,
    fullRatedN1,
    n1ReductionPoints: selected.reductionPoints,
    n1Method: selected.sourceValue.method,
    n1SourceExtractId: selected.sourceValue.sourceExtractId,
    n1SourcePageLabel: selected.sourceValue.sourcePageLabel,
    operationalUseBlocked: true,
    operationalBlockers: [
      "rated-thrust-reduction-25-percent-unresolved",
    ],
    ...(selected.sourceValue.interpolationAuthority
      ? {
          n1InterpolationAuthority:
            selected.sourceValue.interpolationAuthority,
        }
      : {}),
  };
}
