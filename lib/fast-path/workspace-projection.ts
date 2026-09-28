import type { RuntimeChecklist } from "../checklist-runtime.ts";
import type { OperationalEmergencyContent } from "../operational-flight-data.ts";
import type { PilotTakeoffCalculatorDefinition } from "../pilot-takeoff-calculator.ts";
import type { ReferencePresentation } from "../reference-presentation.ts";
import type {
  AircraftPerformanceContent,
  PerformanceDataset,
} from "../universal-aircraft-content.ts";
import type { WorkspaceAircraftScope } from "../workspace-aircraft-scope.ts";

export type FastPathWorkspaceScopeIdentity =
  | {
      readonly status: "selected";
      readonly aircraftId: string;
      readonly requestedVariant?: string;
      readonly selectionSource: "explicit" | "sole-variant-default" | "common-aircraft";
      readonly variantKey: string | null;
      readonly effectiveConfigurationSnapshotId: string;
    }
  | {
      readonly status: "unselected";
      readonly aircraftId: string;
      readonly selectionSource: "none";
    }
  | {
      readonly status: "unknown-variant";
      readonly aircraftId: string;
      readonly requestedVariant: string;
      readonly selectionSource: "explicit";
    }
  | {
      readonly status: "configuration-invalid";
      readonly aircraftId: string;
      readonly requestedVariant?: string;
      readonly selectionSource:
        | "explicit"
        | "sole-variant-default"
        | "common-aircraft";
      readonly variantKey: string | null;
      readonly reason:
        | "effective-configuration-resolution-failed"
        | "ambiguous-variant-request";
    };

export type FastPathWorkspaceProjection = {
  readonly aircraftId: string;
  readonly requestKey: string;
  readonly scope: FastPathWorkspaceScopeIdentity;
  readonly checklist?: RuntimeChecklist;
  readonly emergency?: OperationalEmergencyContent;
  readonly performanceDatasets: readonly PerformanceDataset[];
  readonly takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  readonly reference?: ReferencePresentation;
  readonly referencePerformance?: AircraftPerformanceContent;
};

export function workspaceVariantRequestKey(
  requestedVariant: string | readonly string[] | undefined,
): string {
  const values =
    requestedVariant === undefined
      ? []
      : Array.isArray(requestedVariant)
        ? [...requestedVariant]
        : [requestedVariant as string];

  if (values.length === 0) return "variant:none";
  if (values.length === 1) {
    return `variant:one:${encodeURIComponent(values[0] ?? "")}`;
  }
  return `variant:ambiguous:${values
    .map((value) => encodeURIComponent(value))
    .join(",")}`;
}

export function toFastPathWorkspaceScopeIdentity(
  scope: WorkspaceAircraftScope,
): FastPathWorkspaceScopeIdentity {
  if (scope.status === "selected") {
    return {
      status: "selected",
      aircraftId: scope.aircraftId,
      ...(scope.requestedVariant !== undefined
        ? { requestedVariant: scope.requestedVariant }
        : {}),
      selectionSource: scope.selectionSource,
      variantKey: scope.variantKey,
      effectiveConfigurationSnapshotId:
        scope.effectiveConfigurationSnapshotId,
    };
  }

  if (scope.status === "unselected") {
    return {
      status: "unselected",
      aircraftId: scope.aircraftId,
      selectionSource: "none",
    };
  }

  if (scope.status === "unknown-variant") {
    return {
      status: "unknown-variant",
      aircraftId: scope.aircraftId,
      requestedVariant: scope.requestedVariant,
      selectionSource: "explicit",
    };
  }

  return {
    status: "configuration-invalid",
    aircraftId: scope.aircraftId,
    ...(scope.requestedVariant !== undefined
      ? { requestedVariant: scope.requestedVariant }
      : {}),
    selectionSource: scope.selectionSource,
    variantKey: scope.variantKey,
    reason: scope.reason,
  };
}
