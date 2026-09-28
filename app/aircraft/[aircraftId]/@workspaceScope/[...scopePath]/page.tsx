import { FtWorkspaceScopeServerProjection } from "@/components/ft-shell/FtWorkspaceScopeServerProjection";

export default async function WorkspaceScopeCatchAllSlotPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{
    aircraftId: string;
    scopePath: string[];
  }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}>) {
  const [{ aircraftId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <FtWorkspaceScopeServerProjection
      aircraftId={aircraftId}
      requestedVariant={query.variant}
    />
  );
}
