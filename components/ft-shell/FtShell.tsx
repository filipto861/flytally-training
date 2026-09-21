import type { ReactNode } from "react";

import { FtFastPathPanel } from "@/components/ft-fast-path/FtFastPathPanel";
import { FtFastPathProvider } from "@/components/ft-fast-path/FtFastPathProvider";
import {
  configurationForAircraftVariant,
  filterChecklistForConfiguration,
  resolveSelectedVariant,
} from "@/lib/aircraft-applicability";
import {
  normalizeLegacyFlightFlow,
  normalizeUniversalChecklist,
} from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import type { AircraftChecklistContent } from "@/lib/universal-aircraft-content";

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

  const repository = getTrainingContentRepository();
  const [aircraft, universalChecklist, legacyChecklist] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftChecklistContent>(
      repository,
      aircraftId,
      "checklists",
    ),
    repository.getNormalFlight(aircraftId),
  ]);

  const aircraftIdentity = aircraft?.displayName ?? aircraftId;
  const trainingProfileLabel =
    aircraft?.variantProfiles?.[0]?.displayName ??
    aircraft?.variants[0] ??
    "Current governed package";

  const selectedVariant = aircraft
    ? resolveSelectedVariant(undefined, aircraft.variants)
    : undefined;
  const configuredChecklist =
    aircraft && universalChecklist
      ? filterChecklistForConfiguration(
          universalChecklist,
          configurationForAircraftVariant(aircraft, selectedVariant),
        )
      : undefined;
  const checklist =
    configuredChecklist?.phases.length
      ? normalizeUniversalChecklist(configuredChecklist)
      : !universalChecklist && legacyChecklist
        ? normalizeLegacyFlightFlow(legacyChecklist)
        : undefined;

  return (
    <FtFastPathProvider
      aircraftId={aircraftId}
      checklist={checklist}
      selectedVariant={selectedVariant}
    >
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
        <FtFastPathPanel />
      </section>
    </FtFastPathProvider>
  );
}
