export type SeaLevelPressureAltitudeNormalization = {
  readonly observedPressureAltitudeFt: number;
  readonly performancePressureAltitudeFt: number;
  readonly method: "identity" | "sea-level-floor";
};

/**
 * Some Learjet takeoff performance source tables/charts begin at S.L. rather
 * than publishing negative-pressure-altitude rows. For those sources, a
 * negative derived pressure altitude is evaluated at the S.L. chart floor.
 *
 * This is a one-sided source-floor normalization only. It must not be reused
 * as a generic high-altitude clamp or as permission to extrapolate beyond a
 * source envelope.
 */
export function normalizePressureAltitudeToSeaLevelFloor(
  pressureAltitudeFt: number,
): SeaLevelPressureAltitudeNormalization {
  if (!Number.isFinite(pressureAltitudeFt)) {
    throw new Error("Pressure altitude must be finite.");
  }

  if (pressureAltitudeFt < 0) {
    return {
      observedPressureAltitudeFt: pressureAltitudeFt,
      performancePressureAltitudeFt: 0,
      method: "sea-level-floor",
    };
  }

  return {
    observedPressureAltitudeFt: pressureAltitudeFt,
    performancePressureAltitudeFt: pressureAltitudeFt,
    method: "identity",
  };
}
