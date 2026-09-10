import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ChecklistRunner } from "@/components/checklist-runner";
import { normalizeLegacyFlightFlow, normalizeUniversalChecklist } from "@/lib/checklist-runtime";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftChecklistContent } from "@/lib/universal-aircraft-content";

export default async function ChecklistsPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftChecklistContent>(repository, aircraftId, "checklists"),
    repository.getNormalFlight(aircraftId),
  ]);

  if (!aircraft) notFound();
  const checklist = universal ? normalizeUniversalChecklist(universal) : legacy ? normalizeLegacyFlightFlow(legacy) : undefined;
  if (!checklist) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="checklists" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Checklists · {aircraft.displayName}</p>
        <h1>{checklist.title}</h1>
        <p className="lede">Run the checklist directly, or switch to Learn, Practice, Flow or Challenge & Response without changing the underlying aircraft data.</p>
        {universal?.disclaimer ? <p><strong>Training boundary:</strong> {universal.disclaimer}</p> : null}
        {universal?.sourceNote ? <p><small>Source note · {universal.sourceNote}</small></p> : null}
        {checklist.estimatedMinutes ? <p>Approximate first training pass: {checklist.estimatedMinutes} min.</p> : null}
      </section>
      <ChecklistRunner checklist={checklist} />
    </main>
  );
}
