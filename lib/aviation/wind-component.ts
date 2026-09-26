export type WindComponentBasis =
  | "directional"
  | "calm"
  | "low-variable-zero-baseline";

export interface WindComponents {
  readonly basis: WindComponentBasis;
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
    basis: "directional",
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


export const LOW_VARIABLE_ZERO_BASELINE_MAX_KT = 3;

function zeroWindComponents(
  basis: Extract<WindComponentBasis, "calm" | "low-variable-zero-baseline">,
): WindComponents {
  return {
    basis,
    angleOffDeg: 0,
    headwindKt: 0,
    crosswindKt: 0,
    gustHeadwindKt: 0,
    gustCrosswindKt: 0,
  };
}

/**
 * Resolve one observed METAR wind against a runway.
 *
 * VRB wind is not the same thing as calm wind. For a genuinely light variable
 * report (VRB <= 3 kt, with no gust above 3 kt), Training deliberately uses
 * the governed zero-wind performance baseline rather than inventing a runway
 * direction. Stronger variable wind remains unresolved/fail-closed.
 */
export function calculateObservedRunwayWindComponents(params: {
  readonly windDirectionTrueDeg?: number;
  readonly windSpeedKt?: number;
  readonly windGustKt?: number;
  readonly windVariable: boolean;
  readonly windCalm: boolean;
  readonly runwayHeadingTrueDeg: number;
}): WindComponents | undefined {
  const {
    windDirectionTrueDeg,
    windSpeedKt,
    windGustKt,
    windVariable,
    windCalm,
    runwayHeadingTrueDeg,
  } = params;

  if (!finite(runwayHeadingTrueDeg) || !finite(windSpeedKt)) return undefined;

  if (windCalm || Math.abs(windSpeedKt) < 1e-9) {
    return zeroWindComponents("calm");
  }

  if (windVariable) {
    const maximumObservedKt = Math.max(
      Math.abs(windSpeedKt),
      windGustKt === undefined ? 0 : Math.abs(windGustKt),
    );
    if (maximumObservedKt <= LOW_VARIABLE_ZERO_BASELINE_MAX_KT) {
      return zeroWindComponents("low-variable-zero-baseline");
    }
    return undefined;
  }

  if (!finite(windDirectionTrueDeg)) return undefined;

  return calculateWindComponents({
    windDirectionTrueDeg,
    windSpeedKt,
    windGustKt,
    runwayHeadingTrueDeg,
  });
}
