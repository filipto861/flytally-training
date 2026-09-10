import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { PerformanceExplorer } from "@/components/performance-explorer";
import { configurationForVariant, filterPerformanceForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
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
  const configuredContent = filterPerformanceForConfiguration(content, configurationForVariant(selectedVariant));
  if (!configuredContent.datasets.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="performance" variants={aircraft.variants} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Performance · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{configuredContent.title}</h1>
        <p className="lede">Filter the published performance datasets by their own axes and read the exact source row. The generic explorer never invents interpolation or aircraft-specific calculation logic.</p>
        {configuredContent.disclaimer ? <p><strong>Training boundary:</strong> {configuredContent.disclaimer}</p> : null}
        {configuredContent.sourceNote ? <p><small>Source note · {configuredContent.sourceNote}</small></p> : null}
      </section>
      <PerformanceExplorer datasets={configuredContent.datasets} />
    </main>
  );
}
