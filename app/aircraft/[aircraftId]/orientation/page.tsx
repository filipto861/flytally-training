import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { CockpitOrientationExplorer } from "@/components/cockpit-orientation-explorer";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function CockpitOrientationPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ item?: string }>;
}>) {
  const { aircraftId } = await params;
  const { item } = await searchParams;
  const repository = getTrainingContentRepository();
  const [aircraft, orientation] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getCockpitOrientation(aircraftId),
  ]);

  if (!aircraft || !orientation) notFound();

  const selectedLocation = item
    ? orientation.controls.find((control) => control.checklistItemIds.includes(item))
    : undefined;

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/practice`}>← Practice</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="practice" />

      <section className="workspace-section-hero">
        <p className="eyebrow">Cockpit orientation · {aircraft.displayName}</p>
        <h1>Know which panel to look at before you hunt for a switch.</h1>
        <p className="lede">
          This orientation layer deliberately teaches verified cockpit regions rather than pretending to know pixel-perfect switch coordinates.
          More controls can be added as their locations are confirmed from the source set.
        </p>
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

      <section className="principle">
        <div>
          <p className="eyebrow">Source discipline</p>
          <h2>Panel-level first. Exact hotspots only when we can prove them.</h2>
        </div>
        <p>{orientation.sourceNote}</p>
      </section>
    </main>
  );
}
