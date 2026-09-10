import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { KnowledgeTrainer } from "@/components/knowledge-trainer";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { normalizeLegacyKnowledge, normalizeUniversalKnowledge } from "@/lib/knowledge-runtime";
import type { AircraftKnowledgeContent } from "@/lib/universal-aircraft-content";

export default async function KnowledgePage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftKnowledgeContent>(repository, aircraftId, "knowledge"),
    repository.getReferenceKnowledge(aircraftId),
  ]);

  if (!aircraft) notFound();
  const content = universal ? normalizeUniversalKnowledge(universal) : legacy ? normalizeLegacyKnowledge(legacy) : undefined;
  if (!content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="knowledge" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Knowledge · {aircraft.displayName}</p>
        <h1>{content.title}</h1>
        <p className="lede">Use the question bank to find weak areas, not to collect a meaningless score. Technical answers retain their registered source context.</p>
        {content.sourceNote ? <p>{content.sourceNote}</p> : null}
        {content.disclaimer ? <p><strong>Authority:</strong> {content.disclaimer}</p> : null}
      </section>
      <KnowledgeTrainer content={content} />
    </main>
  );
}
