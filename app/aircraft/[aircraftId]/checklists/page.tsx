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
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}/training`, selectedVariant)}>← Learn</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Learn · Checklist training</p>
        <h1>{checklist.title}</h1>
        <p className="lede">Learn, practise, rehearse flows and challenge & response. Fly remains the stripped operational view.</p>
        {configuredUniversal?.disclaimer || configuredUniversal?.sourceNote || checklist.estimatedMinutes ? <details className="pilot-source-details">
          <summary>Training & source notes</summary>
          {configuredUniversal?.disclaimer ? <p><strong>Training boundary:</strong> {configuredUniversal.disclaimer}</p> : null}
          {configuredUniversal?.sourceNote ? <p>Source note · {configuredUniversal.sourceNote}</p> : null}
          {checklist.estimatedMinutes ? <p>Approximate first training pass: {checklist.estimatedMinutes} min.</p> : null}
        </details> : null}
      </section>
      <ChecklistRunner checklist={checklist} selectedVariant={selectedVariant} />
    </main>
  );
}
