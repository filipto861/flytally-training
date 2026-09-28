import { notFound } from "next/navigation";

import { FtWorkspaceScopeRegistration } from "@/components/ft-shell/FtWorkspaceScopeBridge";
import { getTrainingContentRepository } from "@/lib/content-store";
import {
  resolveWorkspaceAircraftScopeRequest,
  workspaceAircraftScopeIdentity,
  type WorkspaceVariantSearchParam,
} from "@/lib/workspace-aircraft-scope";

export async function FtWorkspaceScopeServerProjection({
  aircraftId,
  requestedVariant,
}: Readonly<{
  aircraftId: string;
  requestedVariant: WorkspaceVariantSearchParam;
}>) {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) notFound();

  const resolution = resolveWorkspaceAircraftScopeRequest(
    aircraft,
    requestedVariant,
  );

  return (
    <FtWorkspaceScopeRegistration
      scope={workspaceAircraftScopeIdentity(
        resolution.scope,
        resolution.requestKey,
      )}
    />
  );
}
