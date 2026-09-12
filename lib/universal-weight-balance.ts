import type { AircraftApplicability, TrainingSourceReference, UniversalModuleMetadata } from "./universal-aircraft-content.ts";

export type WeightBalanceInputKind = "mass-kg" | "fuel-litres";

export type WeightBalanceStation = {
  readonly id: string;
  readonly label: string;
  readonly armMm: number;
  readonly input: WeightBalanceInputKind;
  readonly required?: boolean;
  readonly minimumMassKg?: number;
  readonly maxMassKg?: number;
  readonly maxVolumeL?: number;
  readonly densityKgPerL?: number;
  readonly sources: readonly TrainingSourceReference[];
};

export type WeightBalanceEnvelopePoint = {
  readonly massKg: number;
  readonly forwardCgMm: number;
  readonly aftCgMm: number;
};

export type WeightBalanceCgScale = {
  readonly label: string;
  readonly points: readonly [
    { readonly cgMm: number; readonly value: number },
    { readonly cgMm: number; readonly value: number },
  ];
};

export type AircraftWeightBalanceContent = UniversalModuleMetadata & {
  readonly aircraftId: string;
  readonly title: string;
  /** Configuration boundary for aircraft-specific empty-weight and station data. */
  readonly applicability?: AircraftApplicability;
  readonly empty: {
    readonly massKg: number;
    readonly armMm: number;
    readonly momentKgMm: number;
    readonly sources: readonly TrainingSourceReference[];
  };
  readonly limits: {
    readonly maxTakeoffMassKg: number;
    readonly maxLandingMassKg?: number;
    readonly envelope: readonly WeightBalanceEnvelopePoint[];
    readonly cgScale?: WeightBalanceCgScale;
    readonly sources: readonly TrainingSourceReference[];
  };
  readonly stations: readonly WeightBalanceStation[];
  /** Station whose quantity may decrease between takeoff and landing. */
  readonly fuelBurnStationId?: string;
};

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const objects = (value: unknown): value is RecordValue[] => Array.isArray(value) && value.every(object);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const positive = (value: unknown): value is number => finite(value) && value > 0;
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;

function validSources(value: unknown): boolean {
  return objects(value) && value.length > 0 && value.every((item) =>
    text(item.manualId) && text(item.pageLabel)
    && (item.chapter === undefined || text(item.chapter))
    && (item.section === undefined || text(item.section))
    && (item.note === undefined || text(item.note))
  );
}

export function validateUniversalWeightBalancePayload(payload: unknown): string[] {
  const errors: string[] = [];
  if (!object(payload)) return ["weight-balance payload must be an object"];
  if (!text(payload.aircraftId)) errors.push("weight-balance aircraftId is required");
  if (!text(payload.title)) errors.push("weight-balance title is required");
  if (payload.sourceNote !== undefined && !text(payload.sourceNote)) errors.push("weight-balance sourceNote must be non-empty text when supplied");
  if (payload.disclaimer !== undefined && !text(payload.disclaimer)) errors.push("weight-balance disclaimer must be non-empty text when supplied");

  if (!object(payload.empty)
    || !positive(payload.empty.massKg)
    || !finite(payload.empty.armMm)
    || !positive(payload.empty.momentKgMm)
    || !validSources(payload.empty.sources)) {
    errors.push("weight-balance empty-aircraft data does not match the contract");
  }

  if (!object(payload.limits) || !positive(payload.limits.maxTakeoffMassKg) || !validSources(payload.limits.sources)) {
    errors.push("weight-balance limits do not match the contract");
  } else {
    if (payload.limits.maxLandingMassKg !== undefined && !positive(payload.limits.maxLandingMassKg)) {
      errors.push("weight-balance maxLandingMassKg must be positive when supplied");
    }
    if (!objects(payload.limits.envelope) || payload.limits.envelope.length < 2) {
      errors.push("weight-balance envelope requires at least two points");
    } else {
      payload.limits.envelope.forEach((point, index) => {
        if (!positive(point.massKg) || !finite(point.forwardCgMm) || !finite(point.aftCgMm) || Number(point.forwardCgMm) >= Number(point.aftCgMm)) {
          errors.push(`weight-balance envelope[${index}] does not match the contract`);
        }
      });
    }
    if (payload.limits.cgScale !== undefined) {
      const scale = payload.limits.cgScale;
      if (!object(scale) || !text(scale.label) || !objects(scale.points) || scale.points.length !== 2
        || scale.points.some((point) => !finite(point.cgMm) || !finite(point.value))
        || Number(scale.points[0]?.cgMm) === Number(scale.points[1]?.cgMm)) {
        errors.push("weight-balance cgScale requires two distinct numeric reference points");
      }
    }
  }

  if (!objects(payload.stations) || payload.stations.length === 0) {
    errors.push("weight-balance stations are required");
  } else {
    const ids = new Set<string>();
    payload.stations.forEach((station, index) => {
      const inputKind = station.input;
      if (!text(station.id) || !text(station.label) || !finite(station.armMm)
        || (inputKind !== "mass-kg" && inputKind !== "fuel-litres")
        || !validSources(station.sources)) {
        errors.push(`weight-balance stations[${index}] does not match the station contract`);
        return;
      }
      if (ids.has(station.id)) errors.push(`weight-balance station id ${station.id} is duplicated`);
      ids.add(station.id);
      if (station.required !== undefined && typeof station.required !== "boolean") errors.push(`weight-balance stations[${index}].required must be boolean`);
      if (station.minimumMassKg !== undefined && !nonNegative(station.minimumMassKg)) errors.push(`weight-balance stations[${index}].minimumMassKg must be non-negative`);
      if (station.maxMassKg !== undefined && !positive(station.maxMassKg)) errors.push(`weight-balance stations[${index}].maxMassKg must be positive`);
      if (station.maxVolumeL !== undefined && !positive(station.maxVolumeL)) errors.push(`weight-balance stations[${index}].maxVolumeL must be positive`);
      if (inputKind === "fuel-litres" && !positive(station.densityKgPerL)) errors.push(`weight-balance stations[${index}] fuel input requires densityKgPerL`);
    });
    if (text(payload.fuelBurnStationId)) {
      const fuel = payload.stations.find((station) => station.id === payload.fuelBurnStationId);
      if (!fuel || fuel.input !== "fuel-litres") errors.push("weight-balance fuelBurnStationId must reference a fuel-litres station");
    } else if (payload.fuelBurnStationId !== undefined) {
      errors.push("weight-balance fuelBurnStationId must be non-empty text when supplied");
    }
  }
  return errors;
}

export function isUniversalWeightBalanceContent(value: unknown): value is AircraftWeightBalanceContent {
  return validateUniversalWeightBalancePayload(value).length === 0;
}
