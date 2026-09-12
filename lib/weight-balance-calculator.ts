import type { AircraftWeightBalanceContent, WeightBalanceEnvelopePoint, WeightBalanceStation } from "./universal-weight-balance.ts";

export type WeightBalanceInput = {
  readonly values: Readonly<Record<string, number | undefined>>;
  /** Remaining quantity at landing, in the same input unit as fuelBurnStationId. */
  readonly landingFuelValue?: number;
};

export type WeightBalancePhaseResult = {
  readonly massKg: number;
  readonly momentKgMm: number;
  readonly cgMm: number;
  readonly cgDisplayValue?: number;
  readonly forwardLimitMm?: number;
  readonly aftLimitMm?: number;
  readonly withinMass: boolean;
  readonly withinCg: boolean;
};

export type WeightBalanceCalculation = {
  readonly status: "incomplete" | "invalid" | "ready";
  readonly reason?: string;
  readonly issues: readonly string[];
  readonly takeoff?: WeightBalancePhaseResult;
  readonly landing?: WeightBalancePhaseResult;
  readonly cgShiftMm?: number;
};

function finite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function stationMassKg(station: WeightBalanceStation, value: number): number {
  return station.input === "fuel-litres" ? value * (station.densityKgPerL ?? 0) : value;
}

function envelopeAtMass(points: readonly WeightBalanceEnvelopePoint[], massKg: number): { forwardCgMm: number; aftCgMm: number } | undefined {
  const sorted = [...points].sort((left, right) => left.massKg - right.massKg);
  if (!sorted.length || massKg < sorted[0].massKg || massKg > sorted[sorted.length - 1].massKg) return undefined;
  const exact = sorted.find((point) => Math.abs(point.massKg - massKg) < 1e-9);
  if (exact) return { forwardCgMm: exact.forwardCgMm, aftCgMm: exact.aftCgMm };
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const lower = sorted[index];
    const upper = sorted[index + 1];
    if (massKg > lower.massKg && massKg < upper.massKg) {
      const ratio = (massKg - lower.massKg) / (upper.massKg - lower.massKg);
      return {
        forwardCgMm: lower.forwardCgMm + ratio * (upper.forwardCgMm - lower.forwardCgMm),
        aftCgMm: lower.aftCgMm + ratio * (upper.aftCgMm - lower.aftCgMm),
      };
    }
  }
  return undefined;
}

function cgDisplayValue(content: AircraftWeightBalanceContent, cgMm: number): number | undefined {
  const scale = content.limits.cgScale;
  if (!scale) return undefined;
  const [first, second] = scale.points;
  const ratio = (cgMm - first.cgMm) / (second.cgMm - first.cgMm);
  return first.value + ratio * (second.value - first.value);
}

function phaseResult(
  content: AircraftWeightBalanceContent,
  values: Readonly<Record<string, number>>,
  maxMassKg: number,
): WeightBalancePhaseResult {
  let massKg = content.empty.massKg;
  let momentKgMm = content.empty.momentKgMm;
  for (const station of content.stations) {
    const mass = stationMassKg(station, values[station.id] ?? 0);
    massKg += mass;
    momentKgMm += mass * station.armMm;
  }
  const cgMm = momentKgMm / massKg;
  const envelope = envelopeAtMass(content.limits.envelope, massKg);
  return {
    massKg,
    momentKgMm,
    cgMm,
    cgDisplayValue: cgDisplayValue(content, cgMm),
    forwardLimitMm: envelope?.forwardCgMm,
    aftLimitMm: envelope?.aftCgMm,
    withinMass: massKg <= maxMassKg,
    withinCg: Boolean(envelope && cgMm >= envelope.forwardCgMm && cgMm <= envelope.aftCgMm),
  };
}

function validateStationValue(station: WeightBalanceStation, value: number, issues: string[], context = station.label): void {
  if (!Number.isFinite(value) || value < 0) {
    issues.push(`${context}: enter a non-negative value.`);
    return;
  }
  const mass = stationMassKg(station, value);
  if (station.minimumMassKg !== undefined && mass < station.minimumMassKg) {
    issues.push(`${context}: minimum ${station.minimumMassKg} kg.`);
  }
  if (station.maxMassKg !== undefined && mass > station.maxMassKg + 1e-9) {
    issues.push(`${context}: exceeds ${station.maxMassKg} kg.`);
  }
  if (station.input === "fuel-litres" && station.maxVolumeL !== undefined && value > station.maxVolumeL + 1e-9) {
    issues.push(`${context}: exceeds ${station.maxVolumeL} l.`);
  }
}

export function calculateWeightBalance(content: AircraftWeightBalanceContent, input: WeightBalanceInput): WeightBalanceCalculation {
  const missing = content.stations.filter((station) => station.required && !finite(input.values[station.id]));
  const fuelStation = content.fuelBurnStationId
    ? content.stations.find((station) => station.id === content.fuelBurnStationId)
    : undefined;
  if (fuelStation && !finite(input.landingFuelValue)) {
    return { status: "incomplete", reason: "Enter takeoff loading and planned landing fuel.", issues: [] };
  }
  if (missing.length) {
    return { status: "incomplete", reason: `Enter ${missing.map((station) => station.label).join(", ")}.`, issues: [] };
  }

  const takeoffValues: Record<string, number> = {};
  const issues: string[] = [];
  for (const station of content.stations) {
    const value = input.values[station.id] ?? 0;
    takeoffValues[station.id] = value;
    validateStationValue(station, value, issues);
  }

  const landingValues = { ...takeoffValues };
  if (fuelStation && finite(input.landingFuelValue)) {
    validateStationValue(fuelStation, input.landingFuelValue, issues, `${fuelStation.label} at landing`);
    if (input.landingFuelValue > takeoffValues[fuelStation.id] + 1e-9) {
      issues.push(`${fuelStation.label}: landing quantity cannot exceed takeoff quantity.`);
    }
    landingValues[fuelStation.id] = input.landingFuelValue;
  }

  const takeoff = phaseResult(content, takeoffValues, content.limits.maxTakeoffMassKg);
  const landingMax = content.limits.maxLandingMassKg ?? content.limits.maxTakeoffMassKg;
  const landing = fuelStation ? phaseResult(content, landingValues, landingMax) : undefined;

  if (!takeoff.withinMass) issues.push(`Takeoff mass exceeds ${content.limits.maxTakeoffMassKg} kg.`);
  if (!takeoff.forwardLimitMm || !takeoff.aftLimitMm) issues.push("Takeoff mass is outside the published CG-envelope mass range.");
  else if (!takeoff.withinCg) issues.push(`Takeoff CG is outside ${takeoff.forwardLimitMm.toFixed(1)}–${takeoff.aftLimitMm.toFixed(1)} mm.`);

  if (landing) {
    if (!landing.withinMass) issues.push(`Landing mass exceeds ${landingMax} kg.`);
    if (!landing.forwardLimitMm || !landing.aftLimitMm) issues.push("Landing mass is outside the published CG-envelope mass range.");
    else if (!landing.withinCg) issues.push(`Landing CG is outside ${landing.forwardLimitMm.toFixed(1)}–${landing.aftLimitMm.toFixed(1)} mm.`);
  }

  return {
    status: issues.length ? "invalid" : "ready",
    reason: issues[0],
    issues,
    takeoff,
    landing,
    cgShiftMm: landing ? landing.cgMm - takeoff.cgMm : undefined,
  };
}
