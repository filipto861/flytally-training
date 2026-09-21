export interface WindComponents {
  readonly angleOffDeg: number;
  readonly headwindKt: number;
  readonly crosswindKt: number;
  readonly gustHeadwindKt?: number;
  readonly gustCrosswindKt?: number;
}

function finite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizedAngleDifferenceDeg(directionDeg: number, referenceDeg: number): number {
  let difference = directionDeg - referenceDeg;
  while (difference > 180) difference -= 360;
  while (difference < -180) difference += 360;
  return difference;
}

export function calculateWindComponents(params: {
  readonly windDirectionTrueDeg: number;
  readonly windSpeedKt: number;
  readonly windGustKt?: number;
  readonly runwayHeadingTrueDeg: number;
}): WindComponents | undefined {
  const {
    windDirectionTrueDeg,
    windSpeedKt,
    windGustKt,
    runwayHeadingTrueDeg,
  } = params;

  if (
    !finite(windDirectionTrueDeg)
    || !finite(windSpeedKt)
    || !finite(runwayHeadingTrueDeg)
    || (windGustKt !== undefined && !finite(windGustKt))
  ) {
    return undefined;
  }

  const angleDifferenceDeg = normalizedAngleDifferenceDeg(
    windDirectionTrueDeg,
    runwayHeadingTrueDeg,
  );
  const radians = angleDifferenceDeg * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return {
    angleOffDeg: Math.abs(angleDifferenceDeg),
    headwindKt: windSpeedKt * cosine,
    crosswindKt: windSpeedKt * sine,
    ...(windGustKt === undefined
      ? {}
      : {
          gustHeadwindKt: windGustKt * cosine,
          gustCrosswindKt: windGustKt * sine,
        }),
  };
}
