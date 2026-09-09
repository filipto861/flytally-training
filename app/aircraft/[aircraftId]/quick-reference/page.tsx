import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { QuickReferencePanel } from "@/components/quick-reference-panel";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function QuickReferencePage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getReferenceKnowledge(aircraftId),
  ]);

  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/reference`}>← Reference</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="reference" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Quick Reference · {aircraft.displayName}</p>
        <h1>The numbers and cues you need without reopening a chapter.</h1>
        <p className="lede">Use normal Quick Reference for context and source provenance, then switch to FLY mode for a compact simulator-side view.</p>
      </section>
      <QuickReferencePanel content={content} />
    </main>
  );
}
