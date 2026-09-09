import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { KnowledgeTrainer } from "@/components/knowledge-trainer";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function KnowledgePage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getReferenceKnowledge(aircraftId),
  ]);

  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/progress`}>← Progress</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="progress" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Knowledge · {aircraft.displayName}</p>
        <h1>Short questions. Immediate explanation. Source attached.</h1>
        <p className="lede">Use the question bank to find weak areas, not to collect a meaningless score. Every technical answer links back to the registered source.</p>
      </section>
      <KnowledgeTrainer content={content} />
    </main>
  );
}
