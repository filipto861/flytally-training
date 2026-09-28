import { FtFastPathProjectionRegistrar } from "@/components/ft-fast-path/FtFastPathProjectionRegistrar";
import { getFastPathWorkspaceProjection } from "@/lib/fast-path/workspace-projection-server";

export async function FtWorkspaceScopeSlot({
  aircraftId,
  variant,
}: Readonly<{
  aircraftId: string;
  variant?: string | string[];
}>) {
  const projection = await getFastPathWorkspaceProjection(
    aircraftId,
    variant,
  );
  if (!projection) return null;

  const scope = projection.scope;

  return (
    <>
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
      <FtFastPathProjectionRegistrar projection={projection} />
    </>
  );
}
