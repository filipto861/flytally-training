import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { WorkspaceThemeProvider } from "@/components/ft-workspace-theme";
import "../../ft-workspace/tokens.css";
import "../../ft-workspace/theme.css";

const workspaceSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--ft-font-plex-sans",
});

const workspaceMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--ft-font-plex-mono",
});

export default function AircraftWorkspaceLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <WorkspaceThemeProvider className={`${workspaceSans.variable} ${workspaceMono.variable}`}>
      {children}
    </WorkspaceThemeProvider>
  );
}
