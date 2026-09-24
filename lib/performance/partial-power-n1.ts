import {
  validatePartialPowerN1SourceExtract,
  type PartialPowerN1SourceCell,
  type PartialPowerN1SourceExtract,
} from "./partial-power-source.ts";

export type PartialPowerN1ExactLookupRequest = {
  readonly ambientTemperatureF: number;
  readonly assumedTemperatureF: number;
  readonly pressureAltitudeFt: number;
  readonly antiIce: boolean;
};

export type PartialPowerN1ExactLookupResult =
  | {
      readonly status: "source-value";
      /**
       * Exact value transcribed from the source table.
       *
       * This status is deliberately not named "ready" or "operational":
       * source extracts remain blocked from operational use until the complete
       * reduced-N1 interpolation/semantics contract is source-authorized.
       */
      readonly reducedN1: number;
      readonly sourceCell: PartialPowerN1SourceCell;
      readonly sourceExtractId: string;
      readonly sourcePageLabel: string;
    }
  | {
      readonly status: "blocked";
      readonly reason:
        | "source-extract-invalid"
        | "anti-ice-on"
        | "assumed-temperature-not-above-ambient"
        | "pressure-altitude-limit"
        | "unresolved-parenthesized-source-cell"
        | "exact-source-cell-unavailable";
      readonly detail?: string;
    };

/**
 * Safe reduced-N1 source boundary.
 *
 * It intentionally performs exact source-cell lookup only. It does not
 * interpolate, extrapolate, assign semantics to parenthesized typography, or
 * promote a source extract into an operational performance dataset.
 */
export function lookupPartialPowerN1ExactSourceCell(
  extract: PartialPowerN1SourceExtract,
  request: PartialPowerN1ExactLookupRequest,
): PartialPowerN1ExactLookupResult {
  const validationErrors = validatePartialPowerN1SourceExtract(extract);
  if (validationErrors.length > 0) {
    return {
      status: "blocked",
      reason: "source-extract-invalid",
      detail: validationErrors.join(" "),
    };
  }

  if (request.antiIce) {
    return {
      status: "blocked",
      reason: "anti-ice-on",
    };
  }

  if (request.assumedTemperatureF <= request.ambientTemperatureF) {
    return {
      status: "blocked",
      reason: "assumed-temperature-not-above-ambient",
    };
  }

  const pressureAltitudeLimitFt = extract.constraints.pressureAltitudeLimitFt;
  if (
    pressureAltitudeLimitFt !== null
    && request.pressureAltitudeFt > pressureAltitudeLimitFt
  ) {
    return {
      status: "blocked",
      reason: "pressure-altitude-limit",
      detail: `Source table is limited to pressure altitude <= ${pressureAltitudeLimitFt} ft.`,
    };
  }

  const sourceCell = extract.cells.find((cell) => (
    cell.ambientTemperatureF === request.ambientTemperatureF
    && cell.assumedTemperatureF === request.assumedTemperatureF
  ));

  if (!sourceCell) {
    return {
      status: "blocked",
      reason: "exact-source-cell-unavailable",
      detail: "No exact published source cell exists for the requested temperature pair. Interpolation is not authorized by this boundary.",
    };
  }

  if (sourceCell.sourceStyle === "parenthesized") {
    return {
      status: "blocked",
      reason: "unresolved-parenthesized-source-cell",
      detail: "The source value is parenthesized and its operational meaning has not been established from an authoritative source.",
    };
  }

  return {
    status: "source-value",
    reducedN1: sourceCell.n1,
    sourceCell,
    sourceExtractId: extract.id,
    sourcePageLabel: extract.source.pageLabel,
  };
}


export type PartialPowerN1SourceValueResult =
  | {
      readonly status: "source-value";
      readonly reducedN1: number;
      readonly method: "exact-source-cell" | "bounded-source-interpolation";
      readonly sourceExtractId: string;
      readonly sourcePageLabel: string;
      readonly supportingCells: readonly PartialPowerN1SourceCell[];
      readonly interpolationAuthority?: {
        readonly manualId: "AFMS-W1072";
        readonly figure: "5";
        readonly configuration: "aeronca";
      };
    }
  | {
      readonly status: "blocked";
      readonly reason:
        | Extract<PartialPowerN1ExactLookupResult, { status: "blocked" }>["reason"]
        | "interpolation-not-authorized"
        | "interpolation-source-region-incomplete"
        | "interpolation-source-region-unresolved";
      readonly detail?: string;
    };

function sortedUnique(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function bracket(values: readonly number[], target: number): readonly [number, number] | null {
  const sorted = sortedUnique(values);
  if (sorted.length === 0 || target < sorted[0] || target > sorted[sorted.length - 1]) {
    return null;
  }
  if (sorted.includes(target)) return [target, target];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const lower = sorted[index];
    const upper = sorted[index + 1];
    if (target > lower && target < upper) return [lower, upper];
  }
  return null;
}

function findCell(
  extract: PartialPowerN1SourceExtract,
  ambientTemperatureF: number,
  assumedTemperatureF: number,
): PartialPowerN1SourceCell | undefined {
  return extract.cells.find((cell) => (
    cell.ambientTemperatureF === ambientTemperatureF
    && cell.assumedTemperatureF === assumedTemperatureF
  ));
}

function lerp(
  lowerX: number,
  lowerValue: number,
  upperX: number,
  upperValue: number,
  targetX: number,
): number {
  if (lowerX === upperX) return lowerValue;
  const fraction = (targetX - lowerX) / (upperX - lowerX);
  return lowerValue + ((upperValue - lowerValue) * fraction);
}

/**
 * Source-authorized interpolation boundary for Aeronca-equipped aircraft.
 *
 * AFMS W1072 Figure 5 is a continuous FAA-approved Partial Power Takeoff N1
 * chart for the Aeronca thrust-reverser nozzle and includes a worked example
 * at Assumed Temperature 82°F / Ambient Temperature 50°F -> 91% N1. Because
 * 82°F is not a CL-102B P-6.1 table breakpoint, the supplement provides direct
 * evidence that graphical interpolation between published schedule values is
 * intended for this configuration.
 *
 * This does not resolve CL-102B parenthesized-cell semantics. Any exact cell or
 * interpolation support region touching sourceStyle="parenthesized" remains
 * blocked. No corresponding interpolation authority has been established here
 * for the "none" or "tr4000" schedules.
 */
export function lookupPartialPowerN1SourceValue(
  extract: PartialPowerN1SourceExtract,
  request: PartialPowerN1ExactLookupRequest,
): PartialPowerN1SourceValueResult {
  const exact = lookupPartialPowerN1ExactSourceCell(extract, request);
  if (exact.status === "source-value") {
    return {
      status: "source-value",
      reducedN1: exact.reducedN1,
      method: "exact-source-cell",
      sourceExtractId: exact.sourceExtractId,
      sourcePageLabel: exact.sourcePageLabel,
      supportingCells: [exact.sourceCell],
    };
  }

  if (exact.reason !== "exact-source-cell-unavailable") {
    return exact;
  }

  if (extract.configuration.thrustReversers !== "aeronca") {
    return {
      status: "blocked",
      reason: "interpolation-not-authorized",
      detail: "Reduced-N1 interpolation authority is currently established only for the Aeronca schedule.",
    };
  }

  const ambientBracket = bracket(
    extract.axes.ambientTemperatureF,
    request.ambientTemperatureF,
  );
  const assumedBracket = bracket(
    extract.axes.assumedTemperatureF,
    request.assumedTemperatureF,
  );
  if (!ambientBracket || !assumedBracket) {
    return {
      status: "blocked",
      reason: "interpolation-source-region-incomplete",
      detail: "Requested temperatures are outside the published Aeronca source envelope.",
    };
  }

  const [ambientLow, ambientHigh] = ambientBracket;
  const [assumedLow, assumedHigh] = assumedBracket;
  const coordinates = [
    [ambientLow, assumedLow],
    [ambientLow, assumedHigh],
    [ambientHigh, assumedLow],
    [ambientHigh, assumedHigh],
  ] as const;

  const supportingCells = coordinates
    .map(([ambient, assumed]) => findCell(extract, ambient, assumed))
    .filter((cell): cell is PartialPowerN1SourceCell => Boolean(cell));

  const expectedCellCount =
    ambientLow === ambientHigh && assumedLow === assumedHigh
      ? 1
      : ambientLow === ambientHigh || assumedLow === assumedHigh
        ? 2
        : 4;

  const uniqueSupportingCells = [...new Map(
    supportingCells.map((cell) => [
      `${cell.ambientTemperatureF}:${cell.assumedTemperatureF}`,
      cell,
    ]),
  ).values()];

  if (uniqueSupportingCells.length !== expectedCellCount) {
    return {
      status: "blocked",
      reason: "interpolation-source-region-incomplete",
      detail: "A required published Aeronca source cell is missing; interpolation fails closed.",
    };
  }

  if (uniqueSupportingCells.some((cell) => cell.sourceStyle === "parenthesized")) {
    return {
      status: "blocked",
      reason: "interpolation-source-region-unresolved",
      detail: "Interpolation would depend on a parenthesized source cell whose operational meaning remains unresolved.",
    };
  }

  const lowAmbientLowAssumed = findCell(extract, ambientLow, assumedLow);
  const lowAmbientHighAssumed = findCell(extract, ambientLow, assumedHigh);
  const highAmbientLowAssumed = findCell(extract, ambientHigh, assumedLow);
  const highAmbientHighAssumed = findCell(extract, ambientHigh, assumedHigh);

  if (
    !lowAmbientLowAssumed
    || !lowAmbientHighAssumed
    || !highAmbientLowAssumed
    || !highAmbientHighAssumed
  ) {
    return {
      status: "blocked",
      reason: "interpolation-source-region-incomplete",
    };
  }

  const lowAmbientValue = lerp(
    assumedLow,
    lowAmbientLowAssumed.n1,
    assumedHigh,
    lowAmbientHighAssumed.n1,
    request.assumedTemperatureF,
  );
  const highAmbientValue = lerp(
    assumedLow,
    highAmbientLowAssumed.n1,
    assumedHigh,
    highAmbientHighAssumed.n1,
    request.assumedTemperatureF,
  );
  const reducedN1 = lerp(
    ambientLow,
    lowAmbientValue,
    ambientHigh,
    highAmbientValue,
    request.ambientTemperatureF,
  );

  return {
    status: "source-value",
    reducedN1,
    method: "bounded-source-interpolation",
    sourceExtractId: extract.id,
    sourcePageLabel: extract.source.pageLabel,
    supportingCells: uniqueSupportingCells,
    interpolationAuthority: {
      manualId: "AFMS-W1072",
      figure: "5",
      configuration: "aeronca",
    },
  };
}
