import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { PerformanceCalculator } from "@/components/performance-calculator";
import { configurationForAircraftVariant, filterPerformanceForConfiguration, resolveSelectedVariant } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
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
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredContent = filterPerformanceForConfiguration(content, configurationForAircraftVariant(aircraft, selectedVariant));
  if (!configuredContent.datasets.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="performance" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Reference</p>
        <h1>Performance</h1>
        <p className="lede">Calculate takeoff and landing performance from published aircraft data.</p>
      </section>
      <PerformanceCalculator datasets={configuredContent.datasets} disclaimer={configuredContent.disclaimer} />
    </main>
  );
}
