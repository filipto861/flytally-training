import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { FtPerformancePage } from "@/components/ft-performance/FtPerformancePage";
import { PerformanceCalculator } from "@/components/performance-calculator";
import {
  configurationForAircraftVariant,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
} from "@/lib/aircraft-applicability";
import { getActiveFlight } from "@/lib/active-flight/store";
import { getBundledPerformancePackage } from "@/lib/bundled-performance-content";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { mergePerformanceDatasets } from "@/lib/performance-package";
import { getTrainingSession } from "@/lib/training-session";
import type { AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function PerformancePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const bundledPackage = getBundledPerformancePackage(aircraftId);
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
  ]);
  if (!aircraft || (!content && !bundledPackage)) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuration = configurationForAircraftVariant(aircraft, selectedVariant);
  const configuredPublished = content
    ? filterPerformanceForConfiguration(content, configuration)
    : undefined;
  const configuredBundled = bundledPackage
    ? filterPerformanceForConfiguration(bundledPackage.content, configuration)
    : undefined;
  const datasets = mergePerformanceDatasets(
    configuredPublished?.datasets ?? [],
    configuredBundled?.datasets ?? [],
  );
  if (!datasets.length) notFound();

  const disclaimer =
    configuredPublished?.disclaimer ?? configuredBundled?.disclaimer;

  if (!isNewShellEnabled()) {
    return (
      <main className="shell aircraft-detail">
        <AircraftWorkspaceNav
          aircraftId={aircraft.id}
          active="performance"
          variants={aircraft.variants}
          variantProfiles={aircraft.variantProfiles}
          selectedVariant={selectedVariant}
        />
        <section className="workspace-section-hero">
          <p className="eyebrow">Reference</p>
          <h1>Performance</h1>
          <p className="lede">
            Calculate takeoff and landing performance from published aircraft data.
          </p>
        </section>
        <PerformanceCalculator
          datasets={datasets}
          disclaimer={disclaimer}
          takeoffCalculator={bundledPackage?.takeoffCalculator}
          landingCalculator={bundledPackage?.landingCalculator}
        />
      </main>
    );
  }

  const session = await getTrainingSession();
  const activeFlight = session
    ? await getActiveFlight(session.subject, aircraft.id)
    : undefined;

  return (
    <FtPerformancePage
      aircraftId={aircraft.id}
      aircraftName={aircraft.displayName}
      activeFlight={activeFlight}
      selectedVariant={selectedVariant}
      datasets={datasets}
      takeoffCalculator={bundledPackage?.takeoffCalculator}
      landingCalculator={bundledPackage?.landingCalculator}
      disclaimer={disclaimer}
    />
  );
}
