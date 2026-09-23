import type { ReactNode } from "react";

import { FtFastPathPanel } from "@/components/ft-fast-path/FtFastPathPanel";
import { FtFastPathProvider } from "@/components/ft-fast-path/FtFastPathProvider";
import {
  configurationForAircraftVariant,
  filterChecklistForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
} from "@/lib/aircraft-applicability";
import { getActiveFlight } from "@/lib/active-flight/store";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import {
  normalizeLegacyFlightFlow,
  normalizeUniversalChecklist,
} from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { resolveFastPathQrh } from "@/lib/fast-path/qrh-adapter";
import { getOperationalFlightReadiness } from "@/lib/operational-content-readiness";
import { mergePerformanceDatasets } from "@/lib/performance-package";
import { getTrainingSession } from "@/lib/training-session";
import type {
  AircraftChecklistContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
} from "@/lib/universal-aircraft-content";

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
  const bundledPerformance = getBundledPerformancePackage(aircraftId);
  const [
    aircraft,
    universalChecklist,
    legacyChecklist,
    publishedPerformance,
    publishedAbnormal,
    publishedLimitations,
    operationalReadiness,
    session,
  ] = await Promise.all([
      repository.getAircraft(aircraftId),
      getPublishedAircraftModule<AircraftChecklistContent>(
        repository,
        aircraftId,
        "checklists",
      ),
      repository.getNormalFlight(aircraftId),
      getPublishedAircraftModule<AircraftPerformanceContent>(
        repository,
        aircraftId,
        "performance",
      ),
      getPublishedAircraftModule<unknown>(
        repository,
        aircraftId,
        "abnormal",
      ),
      getPublishedAircraftModule<AircraftLimitationsContent>(
        repository,
        aircraftId,
        "limitations",
      ),
      getOperationalFlightReadiness(aircraftId),
      getTrainingSession(),
    ]);

  const aircraftIdentity = aircraft?.displayName ?? aircraftId;
  const trainingProfileLabel =
    aircraft?.variantProfiles?.[0]?.displayName ??
    aircraft?.variants[0] ??
    "Current governed package";

  const selectedVariant = aircraft
    ? resolveSelectedVariant(undefined, aircraft.variants)
    : undefined;
  const configuration = aircraft
    ? configurationForAircraftVariant(aircraft, selectedVariant)
    : undefined;
  const configuredChecklist =
    aircraft && universalChecklist && configuration
      ? filterChecklistForConfiguration(
          universalChecklist,
          configuration,
        )
      : undefined;
  const checklist =
    configuredChecklist?.phases.length
      ? normalizeUniversalChecklist(configuredChecklist)
      : !universalChecklist && legacyChecklist
        ? normalizeLegacyFlightFlow(legacyChecklist)
        : undefined;

  const configuredPublishedPerformance =
    publishedPerformance && configuration
      ? filterPerformanceForConfiguration(publishedPerformance, configuration)
      : undefined;
  const configuredBundledPerformance =
    bundledPerformance && configuration
      ? filterPerformanceForConfiguration(bundledPerformance.content, configuration)
      : undefined;
  const performanceDatasets = mergePerformanceDatasets(
    configuredPublishedPerformance?.datasets ?? [],
    configuredBundledPerformance?.datasets ?? [],
  );
  const emergency = configuration
    ? resolveFastPathQrh(
        publishedAbnormal,
        configuration,
        operationalReadiness.abnormal.ready,
      )
    : undefined;
  const activeFlight = session
    ? await getActiveFlight(session.subject, aircraftId)
    : undefined;

  return (
    <FtFastPathProvider
      aircraftId={aircraftId}
      checklist={checklist}
      selectedVariant={selectedVariant}
    >
      <section className={styles.shell} data-ft-shell="true" aria-label="Aircraft workspace shell">
        <FtSideNav aircraftId={aircraftId} />

        <div className={styles.workspace}>
          <FtTopBar
            aircraftId={aircraftId}
            aircraftIdentity={aircraftIdentity}
            trainingProfileLabel={trainingProfileLabel}
            activeFlight={activeFlight}
            navigationControl={<FtNavDrawer aircraftId={aircraftId} />}
          />
          <div className={styles.content}>{children}</div>
        </div>

        <FtFastPathRail aircraftId={aircraftId} />
        <FtFastPathPanel
          activeFlight={activeFlight}
          emergency={emergency}
          referenceAircraft={aircraft}
          referenceContent={publishedLimitations}
          performanceDatasets={performanceDatasets}
          takeoffCalculator={bundledPerformance?.takeoffCalculator}
        />
      </section>
    </FtFastPathProvider>
  );
}
