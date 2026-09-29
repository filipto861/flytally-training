import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { FlightDeck } from "@/components/flight-deck";
import { FtConfigurationState } from "@/components/ft-shell/FtConfigurationState";
import { FtWorkspaceScopeIdentity } from "@/components/ft-shell/FtWorkspaceScopeIdentity";
import {
  configurationForAircraftVariant,
  filterAbnormalEmergencyForConfiguration,
  filterChecklistForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
} from "@/lib/aircraft-applicability";
import {
  resolveWorkspaceAircraftScopeFromSearchParam,
} from "@/lib/workspace-aircraft-scope";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import { normalizeUniversalChecklist } from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import {
  toOperationalChecklist,
  toOperationalEmergency,
  toOperationalPerformanceDatasets,
} from "@/lib/operational-flight-data";
import { getOperationalFlightReadiness } from "@/lib/operational-content-readiness";
import { mergePerformanceDatasets } from "@/lib/performance-package";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { isUniversalAbnormalEmergencyContent } from "@/lib/universal-abnormal-emergency";
import type { AircraftChecklistContent, AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function FlyPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const newShell = isNewShellEnabled();
  const repository = getTrainingContentRepository();
  const bundledPerformance = newShell
    ? getBundledPerformancePackage(aircraftId)
    : undefined;
  const [aircraft, checklistContent, performanceContent, abnormalContent, operationalReadiness] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftChecklistContent>(repository, aircraftId, "checklists"),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
    getPublishedAircraftModule<unknown>(repository, aircraftId, "abnormal"),
    getOperationalFlightReadiness(aircraftId),
  ]);
  if (!aircraft) notFound();

  const workspaceScope = newShell
    ? resolveWorkspaceAircraftScopeFromSearchParam(aircraft, variant)
    : undefined;
  if (newShell && workspaceScope && workspaceScope.status !== "selected") {
    return <FtConfigurationState scope={workspaceScope} />;
  }

  const selectedVariant = newShell
    ? workspaceScope?.status === "selected"
      ? workspaceScope.variantKey ?? undefined
      : undefined
    : resolveSelectedVariant(variant as string | undefined, aircraft.variants);
  const configuration =
    newShell && workspaceScope?.status === "selected"
      ? workspaceScope.configuration
      : configurationForAircraftVariant(aircraft, selectedVariant);

  const configuredChecklist = operationalReadiness.checklists.ready && checklistContent
    ? filterChecklistForConfiguration(checklistContent, configuration)
    : undefined;
  const runtimeChecklist = configuredChecklist ? normalizeUniversalChecklist(configuredChecklist) : undefined;
  const checklist = runtimeChecklist ? toOperationalChecklist(runtimeChecklist) : undefined;

  const configuredPerformance = operationalReadiness.performance.ready && performanceContent
    ? filterPerformanceForConfiguration(performanceContent, configuration)
    : undefined;
  const configuredBundledPerformance = bundledPerformance
    ? filterPerformanceForConfiguration(bundledPerformance.content, configuration)
    : undefined;
  const datasets = toOperationalPerformanceDatasets(
    newShell
      ? mergePerformanceDatasets(
          configuredPerformance?.datasets ?? [],
          configuredBundledPerformance?.datasets ?? [],
        )
      : configuredPerformance?.datasets ?? [],
  );

  const configuredAbnormal = operationalReadiness.abnormal.ready && isUniversalAbnormalEmergencyContent(abnormalContent)
    ? filterAbnormalEmergencyForConfiguration(abnormalContent, configuration)
    : undefined;
  const emergency = configuredAbnormal?.scenarios.length
    ? toOperationalEmergency(configuredAbnormal)
    : undefined;

  const noOperationalModules =
    (!checklist || !checklist.phases.length)
    && !datasets.length
    && !emergency?.scenarios.length;

  if (!newShell && noOperationalModules) notFound();

  const deck = (
    <FlightDeck
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      checklist={checklist}
      performanceDatasets={datasets}
      emergency={emergency}
      selectedVariant={selectedVariant}
      presentation={newShell ? "checklist" : "deck"}
    />
  );

  if (newShell) {
    return (
      <main data-ft-fly-page="true" aria-label="Checklist workspace">
        {workspaceScope?.status === "selected" ? (
          <FtWorkspaceScopeIdentity scope={workspaceScope} />
        ) : null}
        {deck}
      </main>
    );
  }

  return (
    <main className="shell aircraft-detail flight-shell">
      <AircraftWorkspaceNav
        aircraftId={aircraft.id}
        active="fly"
        variants={aircraft.variants}
        variantProfiles={aircraft.variantProfiles}
        selectedVariant={selectedVariant}
      />
      {deck}
    </main>
  );
}
