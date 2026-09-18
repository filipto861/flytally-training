import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { CockpitOrientationExplorer } from "@/components/cockpit-orientation-explorer";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { getTrainingContentRepository } from "@/lib/content-store";
import { resolveSelectedVariant,withVariantQuery } from "@/lib/aircraft-applicability";

export default async function CockpitOrientationPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ item?: string; variant?: string }>;
}>) {
  const { aircraftId } = await params;
  const { item,variant } = await searchParams;
  const repository = getTrainingContentRepository();
  const [aircraft, orientation] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getCockpitOrientation(aircraftId),
  ]);

  if (!aircraft || !orientation) notFound();
  const selectedVariant=resolveSelectedVariant(variant,aircraft.variants);
  const href=(path:string)=>withVariantQuery(`/aircraft/${aircraft.id}/${path}`,selectedVariant);

  const selectedLocation = item
    ? orientation.controls.find((control) => control.checklistItemIds.includes(item))
    : undefined;

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={href("training")}>← Learn</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="workspace-section-hero">
        <p className="eyebrow">Learn</p>
        <h1>Cockpit orientation</h1>
        <p className="lede">Know which panel to look at before you hunt for a control.</p>
        <details className="pilot-source-details"><summary>Training & source notes</summary><p>This layer teaches verified cockpit regions rather than inventing pixel-perfect switch coordinates. Exact hotspots are added only when the source set supports them.</p></details>
      </section>

      {selectedLocation ? (
        <section className="principle" aria-label="Checklist show me target">
          <div>
            <p className="eyebrow">Show me</p>
            <h2>{selectedLocation.label}</h2>
          </div>
          <p>{selectedLocation.description} The matching cockpit region is highlighted below.</p>
        </section>
      ) : null}

      <CockpitOrientationExplorer
        initialControlId={selectedLocation?.id}
        orientation={orientation}
      />

      <LearningCompletionButton aircraftId={aircraft.id} kind="orientation" contentId="cockpit-orientation" label="Mark orientation complete" />

      {orientation.sourceNote ? <details className="pilot-source-details orientation-source-note"><summary>Orientation source</summary><p>{orientation.sourceNote}</p></details> : null}
    </main>
  );
}
