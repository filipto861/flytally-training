import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { SystemsBrowser, type RuntimeSystemLesson } from "@/components/systems-browser";
import { configurationForAircraftVariant, filterSystemsForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftSystemsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export default async function SystemsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftSystemsContent>(repository, aircraftId, "systems"),
    repository.getLearningContent(aircraftId),
  ]);
  if (!aircraft) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredUniversal = universal
    ? filterSystemsForConfiguration(universal, configurationForAircraftVariant(aircraft, selectedVariant))
    : undefined;
  const systems: readonly RuntimeSystemLesson[] = configuredUniversal ? configuredUniversal.systems.map((system) => ({
    ...system,
    sourceLabel: formatSources(system.sources),
  })) : legacy?.systems.map((system) => ({
    id: system.id,
    title: system.title,
    summary: system.mentalModel,
    mentalModel: system.mentalModel,
    controls: system.pilotControls,
    indications: system.pilotMonitors,
    normalOperation: system.normalPicture,
    remember: system.remember,
    minutes: system.minutes,
    sourceLabel: system.source.map((item) => `Ch ${item.chapter} · ${item.section} · p. ${item.manualPage}`).join(" · "),
  })) ?? [];
  if (!systems.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="systems" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Systems · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{configuredUniversal?.title ?? `${systems.length} aircraft systems`}</h1>
        <p className="lede">Study one system at a time. Search by component, control, indication, limitation or abnormal cue and keep the source context visible while you build the aircraft mental model.</p>
        {configuredUniversal?.disclaimer ? <p><strong>Training boundary:</strong> {configuredUniversal.disclaimer}</p> : null}
        {configuredUniversal?.sourceNote ? <p><small>Source note · {configuredUniversal.sourceNote}</small></p> : null}
      </section>
      <SystemsBrowser aircraftId={aircraft.id} systems={systems} />
    </main>
  );
}
