export const declaredRunwayDistanceKinds = [
  "TORA",
  "ASDA",
  "TODA",
  "LDA",
] as const;

export type DeclaredRunwayDistanceKind =
  typeof declaredRunwayDistanceKinds[number];

export type DeclaredDistanceProvenance =
  | {
      readonly kind: "manual";
    }
  | {
      readonly kind: "provider";
      readonly providerId: string;
      readonly revision?: string;
    };

export type DeclaredDistanceValue = {
  readonly valueFt: number;
  readonly provenance: DeclaredDistanceProvenance;
};

export type RunwayDeclaredDistances = {
  readonly tora?: DeclaredDistanceValue;
  readonly asda?: DeclaredDistanceValue;
  readonly toda?: DeclaredDistanceValue;
  readonly lda?: DeclaredDistanceValue;
};

export type TakeoffDeclaredDistanceConstraint =
  | {
      readonly status: "ready";
      readonly toraFt: number;
      readonly asdaFt: number;
      readonly usableTakeoffFieldLengthFt: number;
      readonly limitingDistance: "TORA" | "ASDA" | "BOTH";
    }
  | {
      readonly status: "missing";
      readonly missing: readonly ("TORA" | "ASDA")[];
    }
  | {
      readonly status: "invalid";
      readonly errors: readonly string[];
    };

function positiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateDeclaredValue(
  label: DeclaredRunwayDistanceKind,
  value: DeclaredDistanceValue | undefined,
): string[] {
  if (!value) return [];

  const errors: string[] = [];
  if (!positiveFinite(value.valueFt)) {
    errors.push(`${label} must be a positive finite distance in feet.`);
  }

  if (value.provenance.kind === "provider") {
    if (!value.provenance.providerId.trim()) {
      errors.push(`${label} provider provenance requires a providerId.`);
    }
    if (
      value.provenance.revision !== undefined
      && !value.provenance.revision.trim()
    ) {
      errors.push(`${label} provider revision must be non-empty when supplied.`);
    }
  }

  return errors;
}

export function validateRunwayDeclaredDistances(
  distances: RunwayDeclaredDistances,
): readonly string[] {
  return [
    ...validateDeclaredValue("TORA", distances.tora),
    ...validateDeclaredValue("ASDA", distances.asda),
    ...validateDeclaredValue("TODA", distances.toda),
    ...validateDeclaredValue("LDA", distances.lda),
  ];
}

export function manualDeclaredDistanceFt(
  valueFt: number,
): DeclaredDistanceValue {
  return {
    valueFt,
    provenance: { kind: "manual" },
  };
}

export function providerDeclaredDistanceFt(
  valueFt: number,
  providerId: string,
  revision?: string,
): DeclaredDistanceValue {
  return {
    valueFt,
    provenance: {
      kind: "provider",
      providerId,
      ...(revision === undefined ? {} : { revision }),
    },
  };
}

/**
 * Learjet 35/36 takeoff-field-length constraint.
 *
 * FlightSafety states usable takeoff runway is limited by the lower of TORA
 * and ASDA. TODA is not substituted, and physical runway surface length does
 * not belong to this contract.
 */
export function resolveTakeoffDeclaredDistanceConstraint(
  distances: RunwayDeclaredDistances,
): TakeoffDeclaredDistanceConstraint {
  const errors = validateRunwayDeclaredDistances(distances);
  if (errors.length > 0) {
    return { status: "invalid", errors };
  }

  const missing: ("TORA" | "ASDA")[] = [];
  if (!distances.tora) missing.push("TORA");
  if (!distances.asda) missing.push("ASDA");
  if (missing.length > 0) {
    return { status: "missing", missing };
  }

  const toraFt = distances.tora.valueFt;
  const asdaFt = distances.asda.valueFt;
  const usableTakeoffFieldLengthFt = Math.min(toraFt, asdaFt);

  return {
    status: "ready",
    toraFt,
    asdaFt,
    usableTakeoffFieldLengthFt,
    limitingDistance:
      toraFt === asdaFt
        ? "BOTH"
        : toraFt < asdaFt
          ? "TORA"
          : "ASDA",
  };
}
