import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ChecklistRunner } from "@/components/checklist-runner";
import { configurationForAircraftVariant, filterChecklistForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { normalizeLegacyFlightFlow, normalizeUniversalChecklist } from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftChecklistContent } from "@/lib/universal-aircraft-content";

export default async function ChecklistsPage({
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
    getPublishedAircraftModule<AircraftChecklistContent>(repository, aircraftId, "checklists"),
    repository.getNormalFlight(aircraftId),
  ]);

  if (!aircraft) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredUniversal = universal
    ? filterChecklistForConfiguration(universal, configurationForAircraftVariant(aircraft, selectedVariant))
    : undefined;
  const checklist = configuredUniversal ? normalizeUniversalChecklist(configuredUniversal) : legacy ? normalizeLegacyFlightFlow(legacy) : undefined;
  if (!checklist || !checklist.phases.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="checklists" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Checklists · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{checklist.title}</h1>
        <p className="lede">Run the checklist directly, or switch to Learn, Practice, Flow or Challenge & Response without changing the underlying aircraft data.</p>
        {configuredUniversal?.disclaimer ? <p><strong>Training boundary:</strong> {configuredUniversal.disclaimer}</p> : null}
        {configuredUniversal?.sourceNote ? <p><small>Source note · {configuredUniversal.sourceNote}</small></p> : null}
        {checklist.estimatedMinutes ? <p>Approximate first training pass: {checklist.estimatedMinutes} min.</p> : null}
      </section>
      <ChecklistRunner checklist={checklist} selectedVariant={selectedVariant} />
    </main>
  );
}
