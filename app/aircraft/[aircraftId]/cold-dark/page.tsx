import Link from "next/link";
import { notFound } from "next/navigation";

import { ChecklistRunner } from "@/components/checklist-runner";
import { getTrainingAircraft } from "@/lib/aircraft-catalog";
import { getSimulatorFlightFlow } from "@/lib/simulator-checklists";

export default async function ColdDarkPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const aircraft = getTrainingAircraft(aircraftId);
  const flow = getSimulatorFlightFlow(aircraftId);

  if (!aircraft || !flow) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">Simulator quick path</p>
          <h1>{flow.title}</h1>
          <p className="lede">
            Start from a fully cold cockpit, fly one normal sector and return the aircraft to cold & dark.
            This is the default FlyTally Training path — learn by doing, not by reading the full manual first.
          </p>
        </div>
        <aside className="manual-summary">
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

      <section className="principle">
        <div>
          <p className="eyebrow">How to use it</p>
          <h2>Do the action in the sim. Tick it off. Read the “why” only when you need it.</h2>
        </div>
        <p>Every technical item keeps a chapter/page pointer back to the FlightSafety training manual, but the flow itself is deliberately optimized for simulator flying.</p>
      </section>

      <ChecklistRunner flow={flow} />
    </main>
  );
}
