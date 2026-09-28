import { FtWorkspaceScopeSlot } from "@/components/ft-shell/FtWorkspaceScopeSlot";
import { isNewShellEnabled } from "@/lib/feature-flags";

export default async function WorkspaceScopeCatchAllSlot({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string; path: string[] }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}>) {
  if (!isNewShellEnabled()) return null;

  const [{ aircraftId }, { variant }] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <FtWorkspaceScopeSlot
      aircraftId={aircraftId}
      variant={variant}
    />
  );
}
