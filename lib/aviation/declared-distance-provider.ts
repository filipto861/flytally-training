import {
  providerDeclaredDistanceFt,
  validateRunwayDeclaredDistances,
  type RunwayDeclaredDistances,
} from "./declared-distances.ts";

export type DeclaredDistanceProviderQuery = {
  readonly airportIcao: string;
  readonly runwayIdent: string;
};

export type DeclaredDistanceProviderPayload = {
  readonly providerId: string;
  readonly revision?: string;
  readonly airportIcao: string;
  readonly runwayIdent: string;
  readonly distancesFt: {
    readonly tora?: number;
    readonly asda?: number;
    readonly toda?: number;
    readonly lda?: number;
  };
};

export type DeclaredDistanceProviderResolution =
  | {
      readonly status: "ready";
      readonly distances: RunwayDeclaredDistances;
    }
  | {
      readonly status: "unavailable";
      readonly reason: "no-data";
    }
  | {
      readonly status: "mismatch";
      readonly reason: "airport-or-runway-identity";
    }
  | {
      readonly status: "invalid";
      readonly errors: readonly string[];
    };

export interface DeclaredDistanceProvider {
  readonly id: string;
  lookup(
    query: DeclaredDistanceProviderQuery,
  ): Promise<DeclaredDistanceProviderPayload | null>;
}

function normalizeIcao(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeRunwayIdent(value: string): string {
  return value.trim().toUpperCase();
}

function fromPayload(
  payload: DeclaredDistanceProviderPayload,
): RunwayDeclaredDistances {
  const revision = payload.revision;
  return {
    ...(payload.distancesFt.tora === undefined
      ? {}
      : {
          tora: providerDeclaredDistanceFt(
            payload.distancesFt.tora,
            payload.providerId,
            revision,
          ),
        }),
    ...(payload.distancesFt.asda === undefined
      ? {}
      : {
          asda: providerDeclaredDistanceFt(
            payload.distancesFt.asda,
            payload.providerId,
            revision,
          ),
        }),
    ...(payload.distancesFt.toda === undefined
      ? {}
      : {
          toda: providerDeclaredDistanceFt(
            payload.distancesFt.toda,
            payload.providerId,
            revision,
          ),
        }),
    ...(payload.distancesFt.lda === undefined
      ? {}
      : {
          lda: providerDeclaredDistanceFt(
            payload.distancesFt.lda,
            payload.providerId,
            revision,
          ),
        }),
  };
}

/**
 * Normalizes one future authoritative-provider response into the generic
 * declared-distance contract.
 *
 * Identity is checked before any value is accepted. A provider response for
 * another airport/runway is never silently rebound to the current selection.
 */
export function resolveDeclaredDistanceProviderPayload(
  query: DeclaredDistanceProviderQuery,
  payload: DeclaredDistanceProviderPayload | null,
): DeclaredDistanceProviderResolution {
  if (!payload) {
    return {
      status: "unavailable",
      reason: "no-data",
    };
  }

  if (
    normalizeIcao(payload.airportIcao) !== normalizeIcao(query.airportIcao)
    || normalizeRunwayIdent(payload.runwayIdent) !== normalizeRunwayIdent(query.runwayIdent)
  ) {
    return {
      status: "mismatch",
      reason: "airport-or-runway-identity",
    };
  }

  if (!payload.providerId.trim()) {
    return {
      status: "invalid",
      errors: ["Declared-distance provider payload requires a providerId."],
    };
  }

  if (payload.revision !== undefined && !payload.revision.trim()) {
    return {
      status: "invalid",
      errors: ["Declared-distance provider revision must be non-empty when supplied."],
    };
  }

  const distances = fromPayload(payload);
  const errors = validateRunwayDeclaredDistances(distances);
  if (errors.length > 0) {
    return {
      status: "invalid",
      errors,
    };
  }

  return {
    status: "ready",
    distances,
  };
}
