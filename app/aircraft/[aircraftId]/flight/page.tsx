import { notFound, redirect } from "next/navigation";

import { FtFlightPage } from "@/components/ft-flight/FtFlightPage";
import {
  configurationForAircraftVariant,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import { getActiveFlight } from "@/lib/active-flight/store";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { mergePerformanceDatasets } from "@/lib/performance-package";
import { getTrainingSession } from "@/lib/training-session";
import type { AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function FlightPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);

  if (!isNewShellEnabled()) {
    redirect(withVariantQuery(`/aircraft/${aircraftId}/fly`, variant));
  }

  const repository = getTrainingContentRepository();
  const bundledPackage = getBundledPerformancePackage(aircraftId);
  const [aircraft, publishedPerformance] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(
      repository,
      aircraftId,
      "performance",
    ),
  ]);
  if (!aircraft) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuration = configurationForAircraftVariant(aircraft, selectedVariant);
  const configuredPublished = publishedPerformance
    ? filterPerformanceForConfiguration(publishedPerformance, configuration)
    : undefined;
  const configuredBundled = bundledPackage
    ? filterPerformanceForConfiguration(bundledPackage.content, configuration)
    : undefined;
  const performanceDatasets = mergePerformanceDatasets(
    configuredPublished?.datasets ?? [],
    configuredBundled?.datasets ?? [],
  );

  const session = await getTrainingSession();
  const activeFlight = session
    ? await getActiveFlight(session.subject, aircraft.id)
    : undefined;

  return (
    <FtFlightPage
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      selectedVariant={selectedVariant}
      activeFlight={activeFlight}
      performanceDatasets={performanceDatasets}
      takeoffCalculator={bundledPackage?.takeoffCalculator}
    />
  );
}
