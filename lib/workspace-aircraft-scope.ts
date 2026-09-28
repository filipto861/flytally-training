import type {
  TrainingAircraft,
} from "./aircraft-catalog.ts";
import {
  configurationForAircraftVariant,
  effectiveConfigurationSnapshotIdForAircraftVariant,
  type AircraftConfiguration,
} from "./aircraft-applicability.ts";

export type WorkspaceScopeSelectionSource =
  | "explicit"
  | "sole-variant-default"
  | "common-aircraft";

export type WorkspaceScopeSelected = {
  readonly status: "selected";
  readonly aircraftId: string;
  readonly requestedVariant?: string;
  readonly selectionSource: WorkspaceScopeSelectionSource;
  readonly variantKey: string | null;
  readonly configuration: AircraftConfiguration;
  readonly effectiveConfigurationSnapshotId: string;
};

export type WorkspaceScopeUnselected = {
  readonly status: "unselected";
  readonly aircraftId: string;
  readonly requestedVariant?: undefined;
  readonly selectionSource: "none";
};

export type WorkspaceScopeUnknownVariant = {
  readonly status: "unknown-variant";
  readonly aircraftId: string;
  readonly requestedVariant: string;
  readonly selectionSource: "explicit";
};

export type WorkspaceScopeConfigurationInvalid = {
  readonly status: "configuration-invalid";
  readonly aircraftId: string;
  readonly requestedVariant?: string;
  readonly selectionSource:
    | WorkspaceScopeSelectionSource
    | "explicit";
  readonly variantKey: string | null;
  readonly reason: "effective-configuration-resolution-failed";
};

export type WorkspaceAircraftScope =
  | WorkspaceScopeSelected
  | WorkspaceScopeUnselected
  | WorkspaceScopeUnknownVariant
  | WorkspaceScopeConfigurationInvalid;

export type WorkspaceVariantSearchParam =
  | string
  | readonly string[]
  | undefined;

export type WorkspaceAircraftScopeIdentity = {
  readonly status: WorkspaceAircraftScope["status"];
  readonly aircraftId: string;
  readonly requestKey: string;
  readonly requestedVariant?: string;
  readonly selectionSource: WorkspaceAircraftScope["selectionSource"];
  readonly variantKey?: string | null;
  readonly effectiveConfigurationSnapshotId?: string;
  readonly reason?: WorkspaceScopeConfigurationInvalid["reason"];
};

export type WorkspaceAircraftScopeRequestResolution = {
  readonly scope: WorkspaceAircraftScope;
  readonly requestKey: string;
};

function resolveSelected(
  aircraft: Pick<
    TrainingAircraft,
    "id" | "variants" | "variantProfiles" | "equipmentTags"
  >,
  args: {
    readonly requestedVariant?: string;
    readonly variantKey: string | undefined;
    readonly selectionSource: WorkspaceScopeSelectionSource;
  },
): WorkspaceScopeSelected | WorkspaceScopeConfigurationInvalid {
  try {
    const configuration = configurationForAircraftVariant(
      aircraft,
      args.variantKey,
    );
    const effectiveConfigurationSnapshotId =
      effectiveConfigurationSnapshotIdForAircraftVariant(
        aircraft,
        args.variantKey,
      );

    return {
      status: "selected",
      aircraftId: aircraft.id,
      ...(args.requestedVariant !== undefined
        ? { requestedVariant: args.requestedVariant }
        : {}),
      selectionSource: args.selectionSource,
      variantKey: args.variantKey ?? null,
      configuration,
      effectiveConfigurationSnapshotId,
    };
  } catch {
    return {
      status: "configuration-invalid",
      aircraftId: aircraft.id,
      ...(args.requestedVariant !== undefined
        ? { requestedVariant: args.requestedVariant }
        : {}),
      selectionSource: args.selectionSource,
      variantKey: args.variantKey ?? null,
      reason: "effective-configuration-resolution-failed",
    };
  }
}

/**
 * New-shell aircraft workspace selection boundary.
 *
 * This deliberately does NOT replace resolveSelectedVariant(), which remains
 * the legacy/flag-off compatibility resolver until legacy retirement.
 *
 * Semantics:
 * - explicit unknown variant => unknown-variant (never fallback);
 * - no variants at all => common-aircraft selected scope;
 * - one variant and no request => sole-variant-default selected scope;
 * - multiple variants and no request => unselected.
 *
 * Product-mode policy belongs above this pure resolver:
 * EFB gates an unselected scope; LEARN may project common content with an
 * explicit "configuration not selected" indication.
 */
export function resolveWorkspaceAircraftScope(
  aircraft: Pick<
    TrainingAircraft,
    "id" | "variants" | "variantProfiles" | "equipmentTags"
  >,
  requestedVariant: string | undefined,
): WorkspaceAircraftScope {
  if (requestedVariant !== undefined) {
    if (!aircraft.variants.includes(requestedVariant)) {
      return {
        status: "unknown-variant",
        aircraftId: aircraft.id,
        requestedVariant,
        selectionSource: "explicit",
      };
    }

    return resolveSelected(aircraft, {
      requestedVariant,
      variantKey: requestedVariant,
      selectionSource: "explicit",
    });
  }

  if (aircraft.variants.length === 0) {
    return resolveSelected(aircraft, {
      variantKey: undefined,
      selectionSource: "common-aircraft",
    });
  }

  if (aircraft.variants.length === 1) {
    return resolveSelected(aircraft, {
      variantKey: aircraft.variants[0],
      selectionSource: "sole-variant-default",
    });
  }

  return {
    status: "unselected",
    aircraftId: aircraft.id,
    selectionSource: "none",
  };
}

export function workspaceVariantRequestKey(
  requestedVariant: WorkspaceVariantSearchParam,
): string {
  if (requestedVariant === undefined) return "none";
  if (Array.isArray(requestedVariant)) {
    return `multiple:${encodeURIComponent(JSON.stringify(requestedVariant))}`;
  }
  return `single:${encodeURIComponent(requestedVariant)}`;
}

export function resolveWorkspaceAircraftScopeRequest(
  aircraft: Pick<
    TrainingAircraft,
    "id" | "variants" | "variantProfiles" | "equipmentTags"
  >,
  requestedVariant: WorkspaceVariantSearchParam,
): WorkspaceAircraftScopeRequestResolution {
  const requestKey = workspaceVariantRequestKey(requestedVariant);

  /*
   * Repeated variant query parameters are ambiguous input, never permission to
   * pick one candidate. Reuse the existing unknown-variant fail-closed state
   * without broadening the accepted workspace state machine in this spike.
   */
  if (Array.isArray(requestedVariant)) {
    return {
      requestKey,
      scope: {
        status: "unknown-variant",
        aircraftId: aircraft.id,
        requestedVariant: requestedVariant.join(","),
        selectionSource: "explicit",
      },
    };
  }

  return {
    requestKey,
    scope: resolveWorkspaceAircraftScope(aircraft, requestedVariant),
  };
}

export function workspaceAircraftScopeIdentity(
  scope: WorkspaceAircraftScope,
  requestKey: string,
): WorkspaceAircraftScopeIdentity {
  return {
    status: scope.status,
    aircraftId: scope.aircraftId,
    requestKey,
    ...("requestedVariant" in scope && scope.requestedVariant !== undefined
      ? { requestedVariant: scope.requestedVariant }
      : {}),
    selectionSource: scope.selectionSource,
    ...("variantKey" in scope ? { variantKey: scope.variantKey } : {}),
    ...(scope.status === "selected"
      ? {
          effectiveConfigurationSnapshotId:
            scope.effectiveConfigurationSnapshotId,
        }
      : {}),
    ...(scope.status === "configuration-invalid"
      ? { reason: scope.reason }
      : {}),
  };
}

export function isSelectedWorkspaceAircraftScope(
  scope: WorkspaceAircraftScope,
): scope is WorkspaceScopeSelected {
  return scope.status === "selected";
}
