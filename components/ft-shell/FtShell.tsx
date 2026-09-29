import type { ReactNode } from "react";

import { FtFastPathPanel } from "@/components/ft-fast-path/FtFastPathPanel";
import { FtFastPathProvider } from "@/components/ft-fast-path/FtFastPathProvider";
import { getActiveFlight } from "@/lib/active-flight/store";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { getTrainingSession } from "@/lib/training-session";

import { FtFastPathRail } from "./FtFastPathRail";
import { FtNavDrawer } from "./FtNavDrawer";
import { FtSideNav } from "./FtSideNav";
import { FtTopBar } from "./FtTopBar";
import styles from "./ft-shell.module.css";

export async function FtShell({
  aircraftId,
  children,
  workspaceScope,
}: Readonly<{
  aircraftId: string;
  children: ReactNode;
  workspaceScope?: ReactNode;
}>) {
  if (!isNewShellEnabled()) return <>{children}</>;

  const repository = getTrainingContentRepository();
  const [aircraft, session] = await Promise.all([
    repository.getAircraft(aircraftId),
    getTrainingSession(),
  ]);
  const aircraftIdentity = aircraft?.displayName ?? aircraftId;
  const aircraftProfileLabel =
    aircraft?.variantProfiles?.[0]?.displayName
    ?? aircraft?.variants[0]
    ?? "Current governed package";
  const activeFlight = session
    ? await getActiveFlight(session.subject, aircraftId)
    : undefined;

  return (
    <FtFastPathProvider
      aircraftId={aircraftId}
      activeFlight={activeFlight}
    >
      {workspaceScope}
      <section
        className={styles.shell}
        data-ft-shell="true"
        aria-label="Aircraft workspace shell"
      >
        <FtSideNav aircraftId={aircraftId} />

        <div className={styles.workspace}>
          <FtTopBar
            aircraftId={aircraftId}
            aircraftIdentity={aircraftIdentity}
            aircraftProfileLabel={aircraftProfileLabel}
            activeFlight={activeFlight}
            navigationControl={<FtNavDrawer aircraftId={aircraftId} />}
          />
          <div className={styles.content}>{children}</div>
        </div>

        <FtFastPathRail aircraftId={aircraftId} />
        <FtFastPathPanel activeFlight={activeFlight} />
      </section>
    </FtFastPathProvider>
  );
}
