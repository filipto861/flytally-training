import type {
  AirportDatasetV1,
  AirportRecord,
  RunwayEnd,
  RunwaySurface,
  SelectedRunwayContext,
  SourcedValue,
} from "./airport-types.ts";

export type AvailableRunwayEnd = {
  readonly ident: string;
  readonly runway: RunwaySurface;
  readonly end: RunwayEnd;
};

export function availableRunwayEnds(airport: AirportRecord): readonly AvailableRunwayEnd[] {
  return airport.runways
    .filter((runway) => !runway.closed)
    .flatMap((runway) => runway.ends.map((end) => ({ ident: end.ident, runway, end })))
    .sort((left, right) => left.ident.localeCompare(right.ident, undefined, { numeric: true }));
}

export function resolveRunwayEnd(
  airport: AirportRecord,
  runwayIdent: string,
  dataSource?: AirportDatasetV1["source"],
): SelectedRunwayContext | undefined {
  const normalized = runwayIdent.trim().toUpperCase();
  const match = availableRunwayEnds(airport).find((candidate) => candidate.ident.toUpperCase() === normalized);
  if (!match) return undefined;
  const oppositeEnd = match.runway.ends.find((end) => end !== match.end);
  return {
    airportIcao: airport.icao,
    runwaySurfaceId: match.runway.id,
    runwayIdent: match.end.ident,
    airportElevationFt: airport.elevationFt,
    runwayEndElevationFt: match.end.elevationFt,
    oppositeEndElevationFt: oppositeEnd?.elevationFt,
    headingTrueDeg: match.end.headingTrueDeg,
    surfaceLengthFt: match.runway.surfaceLengthFt,
    availableTakeoffLengthFt: match.runway.surfaceLengthFt,
    lengthBasis: "physical-surface-length",
    dataSource,
    surface: match.runway.surface,
  };
}

export function calculateRunwayMarginFt(
  requiredDistanceFt: number,
  availableLengthFt: number,
): {
  marginFt: number;
  usePercent: number;
  withinLength: boolean;
} {
  if (!Number.isFinite(requiredDistanceFt) || requiredDistanceFt < 0) {
    throw new RangeError("Required distance must be a non-negative finite number.");
  }
  if (!Number.isFinite(availableLengthFt) || availableLengthFt <= 0) {
    throw new RangeError("Available runway length must be a positive finite number.");
  }
  const rawUsePercent = (requiredDistanceFt / availableLengthFt) * 100;
  return {
    marginFt: availableLengthFt - requiredDistanceFt,
    usePercent: Number(rawUsePercent.toFixed(6)),
    withinLength: requiredDistanceFt <= availableLengthFt,
  };
}

export function manualSourcedValue<T>(value: T): SourcedValue<T> {
  return { value, source: "manual", dirty: true };
}

export function airportAutoFill<T>(
  current: SourcedValue<T>,
  value: T,
): SourcedValue<T> {
  return current.dirty ? current : { value, source: "airport-db", dirty: false };
}

export function metarAutoFill<T>(
  current: SourcedValue<T>,
  value: T,
  force = false,
): SourcedValue<T> {
  return current.dirty && !force
    ? current
    : { value, source: "metar", dirty: false };
}
