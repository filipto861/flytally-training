import { FtWorkspaceScopeServerProjection } from "@/components/ft-shell/FtWorkspaceScopeServerProjection";

export default async function WorkspaceScopeSlotPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
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
