import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { KnowledgeTrainer } from "@/components/knowledge-trainer";
import { configurationForAircraftVariant, filterKnowledgeForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { normalizeLegacyKnowledge, normalizeUniversalKnowledge } from "@/lib/knowledge-runtime";
import type { AircraftKnowledgeContent } from "@/lib/universal-aircraft-content";

export default async function KnowledgePage({
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
    getPublishedAircraftModule<AircraftKnowledgeContent>(repository, aircraftId, "knowledge"),
    repository.getReferenceKnowledge(aircraftId),
  ]);

  if (!aircraft) notFound();
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredUniversal = universal
    ? filterKnowledgeForConfiguration(universal, configurationForAircraftVariant(aircraft, selectedVariant))
    : undefined;
  const content = configuredUniversal ? normalizeUniversalKnowledge(configuredUniversal) : legacy ? normalizeLegacyKnowledge(legacy) : undefined;
  if (!content || !content.questions.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="knowledge" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Knowledge · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{content.title}</h1>
        <p className="lede">Use the question bank to find weak areas, not to collect a meaningless score. Technical answers retain their registered source context.</p>
        {content.sourceNote ? <p>{content.sourceNote}</p> : null}
        {content.disclaimer ? <p><strong>Authority:</strong> {content.disclaimer}</p> : null}
      </section>
      <KnowledgeTrainer content={content} />
    </main>
  );
}
