import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { FlightDeck } from "@/components/flight-deck";
import {
  configurationForAircraftVariant,
  filterChecklistForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
} from "@/lib/aircraft-applicability";
import { normalizeLegacyFlightFlow, normalizeUniversalChecklist } from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftChecklistContent, AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function FlyPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, checklistContent, legacyChecklist, performanceContent] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftChecklistContent>(repository, aircraftId, "checklists"),
    repository.getNormalFlight(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
  ]);
  if (!aircraft) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuration = configurationForAircraftVariant(aircraft, selectedVariant);
  const configuredChecklist = checklistContent ? filterChecklistForConfiguration(checklistContent, configuration) : undefined;
  const checklist = configuredChecklist
    ? normalizeUniversalChecklist(configuredChecklist)
    : legacyChecklist
      ? normalizeLegacyFlightFlow(legacyChecklist)
      : undefined;
  const configuredPerformance = performanceContent ? filterPerformanceForConfiguration(performanceContent, configuration) : undefined;
  const datasets = configuredPerformance?.datasets ?? [];

  if ((!checklist || !checklist.phases.length) && !datasets.length) notFound();

  return (
    <main className="shell aircraft-detail flight-shell">
      <AircraftWorkspaceNav
        aircraftId={aircraft.id}
        active="fly"
        variants={aircraft.variants}
        variantProfiles={aircraft.variantProfiles}
        selectedVariant={selectedVariant}
      />
      <FlightDeck
        aircraftId={aircraft.id}
        aircraftName={aircraft.displayName}
        checklist={checklist}
        performanceDatasets={datasets}
        selectedVariant={selectedVariant}
      />
    </main>
  );
}
