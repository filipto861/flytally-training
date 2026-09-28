import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { FtShell } from "@/components/ft-shell/FtShell";
import { WorkspaceThemeProvider } from "@/components/ft-workspace-theme";
import { isNewShellEnabled } from "@/lib/feature-flags";
import "../../ft-workspace/tokens.css";
import "../../ft-workspace/theme.css";

const workspaceSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--ft-font-plex-sans",
});

const workspaceMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--ft-font-plex-mono",
});

export default async function AircraftWorkspaceLayout({
  children,
  workspaceScope,
  params,
}: Readonly<{
  children: ReactNode;
  workspaceScope: ReactNode;
  params: Promise<{ aircraftId: string }>;
}>) {
  const { aircraftId } = await params;
  const newShell = isNewShellEnabled();

  return (
    <WorkspaceThemeProvider className={`${workspaceSans.variable} ${workspaceMono.variable}`}>
      {newShell ? (
        <FtShell
          aircraftId={aircraftId}
          workspaceScopeSlot={workspaceScope}
        >
          {children}
        </FtShell>
      ) : children}
    </WorkspaceThemeProvider>
  );
}
