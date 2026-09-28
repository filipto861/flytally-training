import { notFound } from "next/navigation";

import { FtWorkspaceScopeRegistration } from "@/components/ft-shell/FtWorkspaceScopeBridge";
import { getTrainingContentRepository } from "@/lib/content-store";
import {
  resolveWorkspaceAircraftScopeRequest,
  workspaceAircraftScopeIdentity,
} from "@/lib/workspace-aircraft-scope";

export default async function WorkspaceScopeSlotPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{
    aircraftId: string;
    scopePath?: readonly string[];
  }>;
  searchParams: Promise<{
    variant?: string | string[];
  }>;
}>) {
  const [{ aircraftId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const repository = getTrainingContentRepository();
  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) notFound();

  const resolution = resolveWorkspaceAircraftScopeRequest(
    aircraft,
    query.variant,
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
