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
  | Readonly<{
      status: "selected";
      aircraftId: string;
      requestedVariant?: string;
      selectionSource: "explicit" | "sole-variant-default" | "common-aircraft";
      variantKey: string | null;
      effectiveConfigurationSnapshotId: string;
    }>
  | Readonly<{
      status: "unselected";
      aircraftId: string;
      selectionSource: "none";
    }>
  | Readonly<{
      status: "unknown-variant";
      aircraftId: string;
      requestedVariant: string;
      selectionSource: "explicit";
    }>
  | Readonly<{
      status: "configuration-invalid";
      aircraftId: string;
      requestedVariant?: string;
      selectionSource:
        | "explicit"
        | "sole-variant-default"
        | "common-aircraft";
      variantKey: string | null;
      reason:
        | "effective-configuration-resolution-failed"
        | "ambiguous-variant-request";
    }>;

export type FastPathWorkspaceProjection = Readonly<{
  scope: FastPathWorkspaceScopeIdentity;
  queryVariantValues: readonly string[];
  profileLabel: string;
  checklist?: RuntimeChecklist;
  emergency?: OperationalEmergencyContent;
  reference?: ReferencePresentation;
  referencePerformance?: AircraftPerformanceContent;
  performanceDatasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>;

export function fastPathScopeIdentity(
  scope: WorkspaceAircraftScope,
): FastPathWorkspaceScopeIdentity {
  if (scope.status === "selected") {
    return {
      status: scope.status,
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

  if (scope.status === "unknown-variant") {
    return {
      status: scope.status,
      aircraftId: scope.aircraftId,
      requestedVariant: scope.requestedVariant,
      selectionSource: scope.selectionSource,
    };
  }

  if (scope.status === "configuration-invalid") {
    return {
      status: scope.status,
      aircraftId: scope.aircraftId,
      ...(scope.requestedVariant !== undefined
        ? { requestedVariant: scope.requestedVariant }
        : {}),
      selectionSource: scope.selectionSource,
      variantKey: scope.variantKey,
      reason: scope.reason,
    };
  }

  return {
    status: scope.status,
    aircraftId: scope.aircraftId,
    selectionSource: scope.selectionSource,
  };
}

export function fastPathProjectionMatchesVariantQuery(
  projection: Pick<FastPathWorkspaceProjection, "queryVariantValues">,
  currentValues: readonly string[],
): boolean {
  return (
    projection.queryVariantValues.length === currentValues.length
    && projection.queryVariantValues.every(
      (value, index) => value === currentValues[index],
    )
  );
}
