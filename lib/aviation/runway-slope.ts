export interface RunwaySlope {
  readonly slopePercent: number;
  readonly slopeDegrees: number;
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

export function calculateRunwaySlope(params: {
  readonly startEndElevationFt: number;
  readonly oppositeEndElevationFt: number;
  readonly surfaceLengthFt: number;
}): RunwaySlope | undefined {
  const {
    startEndElevationFt,
    oppositeEndElevationFt,
    surfaceLengthFt,
  } = params;

  if (
    !finite(startEndElevationFt)
    || !finite(oppositeEndElevationFt)
    || !finite(surfaceLengthFt)
    || surfaceLengthFt <= 0
  ) {
    return undefined;
  }

  if (startEndElevationFt === oppositeEndElevationFt) {
    return { slopePercent: 0, slopeDegrees: 0 };
  }

  const slopePercent = (
    (oppositeEndElevationFt - startEndElevationFt)
    / surfaceLengthFt
  ) * 100;
  const slopeDegrees = Math.atan(slopePercent / 100) * 180 / Math.PI;

  return { slopePercent, slopeDegrees };
}
