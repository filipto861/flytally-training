import type { WorkspaceScopeSelected } from "@/lib/workspace-aircraft-scope";

export function FtWorkspaceScopeIdentity({
  scope,
}: Readonly<{
  scope: WorkspaceScopeSelected;
}>) {
  return (
    <span
      hidden
      data-ft-page-workspace-scope="true"
      data-aircraft-id={scope.aircraftId}
      data-variant-key={scope.variantKey ?? "common"}
      data-effective-configuration-snapshot-id={
        scope.effectiveConfigurationSnapshotId
      }
    />
  );
}
