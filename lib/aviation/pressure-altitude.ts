export type AltimeterUnit = "hPa" | "inHg";

export type AltimeterSetting =
  | { readonly unit: "hPa"; readonly value: number }
  | { readonly unit: "inHg"; readonly value: number };

export const STANDARD_PRESSURE_HPA = 1013.25;
export const INHG_TO_HPA = 33.8639;

export function altimeterToHpa(setting: AltimeterSetting): number {
  return setting.unit === "hPa" ? setting.value : setting.value * INHG_TO_HPA;
}

export function hpaToInHg(valueHpa: number): number {
  return valueHpa / INHG_TO_HPA;
}

export function calculatePressureAltitudeFt(
  elevationFt: number,
  altimeter: AltimeterSetting,
): number {
  const qnhHpa = altimeterToHpa(altimeter);
  if (!Number.isFinite(elevationFt) || !Number.isFinite(qnhHpa) || qnhHpa <= 0) {
    throw new RangeError("Elevation and altimeter setting must be finite and altimeter must be positive.");
  }
  return elevationFt + (STANDARD_PRESSURE_HPA - qnhHpa) * 30;
}
