import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LimitationsExplorer } from "@/components/limitations-explorer";
import { configurationForAircraftVariant, filterLimitationsForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftLimitationsContent } from "@/lib/universal-aircraft-content";

export default async function LimitationsPage({
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
    getPublishedAircraftModule<AircraftLimitationsContent>(repository, aircraftId, "limitations"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredContent = filterLimitationsForConfiguration(content, configurationForAircraftVariant(aircraft, selectedVariant));
  if (!configuredContent.groups.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="limitations" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Limitations · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{configuredContent.title}</h1>
        <p className="lede">Use the source-backed limitation set as a fast study reference. Search values and conditions, narrow by category, and isolate published warnings or cautions without inferring limits that are not in this aircraft configuration.</p>
        {configuredContent.disclaimer ? <p><strong>Training boundary:</strong> {configuredContent.disclaimer}</p> : null}
        {configuredContent.sourceNote ? <p><small>Source note · {configuredContent.sourceNote}</small></p> : null}
      </section>
      <LimitationsExplorer groups={configuredContent.groups} />
    </main>
  );
}
