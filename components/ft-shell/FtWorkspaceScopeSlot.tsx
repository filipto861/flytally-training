import { getTrainingContentRepository } from "@/lib/content-store";
import { resolveWorkspaceAircraftScopeFromSearchParam } from "@/lib/workspace-aircraft-scope";

export async function FtWorkspaceScopeSlot({
  aircraftId,
  variant,
}: Readonly<{
  aircraftId: string;
  variant?: string | string[];
}>) {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) return null;

  const scope = resolveWorkspaceAircraftScopeFromSearchParam(
    aircraft,
    variant,
  );

  return (
    <span
      hidden
      data-ft-workspace-scope-slot="true"
      data-aircraft-id={scope.aircraftId}
      data-scope-status={scope.status}
      data-selection-source={scope.selectionSource}
      {...("requestedVariant" in scope && scope.requestedVariant !== undefined
        ? { "data-requested-variant": scope.requestedVariant }
        : {})}
      {...(scope.status === "selected"
        ? {
            "data-variant-key": scope.variantKey ?? "common",
            "data-effective-configuration-snapshot-id":
              scope.effectiveConfigurationSnapshotId,
          }
        : {})}
      {...(scope.status === "configuration-invalid"
        ? { "data-scope-reason": scope.reason }
        : {})}
    />
  );
}
