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
