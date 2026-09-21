import type { ReactNode } from "react";

import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";

import { FtFastPathRail } from "./FtFastPathRail";
import { FtNavDrawer } from "./FtNavDrawer";
import { FtSideNav } from "./FtSideNav";
import { FtTopBar } from "./FtTopBar";
import styles from "./ft-shell.module.css";

export async function FtShell({
  aircraftId,
  children,
}: Readonly<{
  aircraftId: string;
  children: ReactNode;
}>) {
  if (!isNewShellEnabled()) return <>{children}</>;

  const aircraft = await getTrainingContentRepository().getAircraft(aircraftId);
  const aircraftIdentity = aircraft?.displayName ?? aircraftId;
  const trainingProfileLabel =
    aircraft?.variantProfiles?.[0]?.displayName ??
    aircraft?.variants[0] ??
    "Current governed package";

  return (
    <section className={styles.shell} data-ft-shell="true" aria-label="Aircraft workspace shell">
      <FtTopBar
        aircraftId={aircraftId}
        aircraftIdentity={aircraftIdentity}
        trainingProfileLabel={trainingProfileLabel}
        navigationControl={<FtNavDrawer aircraftId={aircraftId} />}
      />

      <div className={styles.workspace}>
        <FtSideNav aircraftId={aircraftId} />
        <div className={styles.content}>{children}</div>
      </div>

      <FtFastPathRail aircraftId={aircraftId} />
    </section>
  );
}
