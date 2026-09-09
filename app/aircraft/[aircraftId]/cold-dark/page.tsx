import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { ChecklistRunner } from "@/components/checklist-runner";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function ColdDarkPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, flow, orientation] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getNormalFlight(aircraftId),
    repository.getCockpitOrientation(aircraftId),
  ]);

  if (!aircraft || !flow) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="practice" />

      <section className="detail-hero workspace-hero">
        <div>
          <p className="eyebrow">First Flight</p>
          <h1>{flow.title}</h1>
          <p className="lede">
            Start from a fully cold cockpit, fly one normal sector and return the aircraft to cold & dark. Do the action in the sim and open the explanation only when you need the context.
          </p>
        </div>
        <aside className="manual-summary compact-summary">
          <span className="source-pill">Simulator checklist · not AFM</span>
          <h2>{aircraft.displayName}</h2>
          <dl>
            <div><dt>Start</dt><dd>Cold & dark</dd></div>
            <div><dt>Finish</dt><dd>Cold & dark</dd></div>
            <div><dt>First pass</dt><dd>~{flow.estimatedMinutes} min</dd></div>
          </dl>
          <p>{flow.sourceNote}</p>
        </aside>
      </section>

      <ChecklistRunner flow={flow} orientation={orientation} />
    </main>
  );
}
