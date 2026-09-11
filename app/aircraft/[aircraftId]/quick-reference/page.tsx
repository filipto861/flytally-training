import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { PilotQuickReference } from "@/components/pilot-quick-reference";
import {
  configurationForAircraftVariant,
  filterLimitationsForConfiguration,
  filterPerformanceForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftLimitationsContent, AircraftPerformanceContent } from "@/lib/universal-aircraft-content";

export default async function QuickReferencePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, performance, limitations] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftPerformanceContent>(repository, aircraftId, "performance"),
    getPublishedAircraftModule<AircraftLimitationsContent>(repository, aircraftId, "limitations"),
  ]);

  if (!aircraft || !performance || !limitations) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuration = configurationForAircraftVariant(aircraft, selectedVariant);
  const configuredPerformance = filterPerformanceForConfiguration(performance, configuration);
  const configuredLimitations = filterLimitationsForConfiguration(limitations, configuration);
  if (!configuredPerformance.datasets.length || !configuredLimitations.groups.length) notFound();

  const manualLabels = Object.fromEntries(
    aircraft.manuals.map((manual) => [manual.id, `${manual.publisher} · ${manual.title} · ${manual.revision}`]),
  );

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="quick-reference" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">FLY · Quick Reference · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>Complete published cockpit data.</h1>
        <p className="lede">One place for every currently published limitation, speed, power reference and performance source row that applies to the selected aircraft configuration. Source authority stays visible and no missing value is invented.</p>
      </section>
      <PilotQuickReference performance={configuredPerformance} limitations={configuredLimitations} manualLabels={manualLabels} />
    </main>
  );
}
