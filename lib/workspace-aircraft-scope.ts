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

export function isSelectedWorkspaceAircraftScope(
  scope: WorkspaceAircraftScope,
): scope is WorkspaceScopeSelected {
  return scope.status === "selected";
}
