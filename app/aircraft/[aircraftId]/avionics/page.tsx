import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import {
  configurationForAircraftVariant,
  filterAvionicsForConfiguration,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { sourceAuthorityLabel } from "@/lib/source-authority";
import type { AircraftAvionicsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";

function formatSource(source: TrainingSourceReference, aircraft: TrainingAircraft): string {
  const registered = aircraft.manuals.find((manual) => manual.id === source.manualId);
  const sourceName = registered?.title ?? source.manualId;
  const authority = registered ? sourceAuthorityLabel(registered.authorityRole) : "Unregistered source";
  const location = [source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`]
    .filter(Boolean)
    .join(" · ");
  return `${authority} · ${sourceName} · ${location}`;
}

export default async function AvionicsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftAvionicsContent>(repository, aircraftId, "avionics"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredContent = filterAvionicsForConfiguration(
    content,
    configurationForAircraftVariant(aircraft, selectedVariant),
  );
  if (!configuredContent.topics.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav
        aircraftId={aircraft.id}
        active="avionics"
        variants={aircraft.variants}
        variantProfiles={aircraft.variantProfiles}
        selectedVariant={selectedVariant}
      />

      <section className="workspace-section-hero">
        <p className="eyebrow">Learn</p>
        <h1>Avionics</h1>
        <p className="lede">Study the installed avionics for the selected aircraft configuration.</p>
        {configuredContent.sourceNote || configuredContent.disclaimer ? <details className="pilot-source-details">
          <summary>Training & source notes</summary>
          {configuredContent.disclaimer ? <p><strong>Training boundary:</strong> {configuredContent.disclaimer}</p> : null}
          {configuredContent.sourceNote ? <p>Source note · {configuredContent.sourceNote}</p> : null}
        </details> : null}
      </section>

      {configuredContent.topics.map((topic, index) => (
        <section className="reference-library" id={topic.id} key={topic.id}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Topic {index + 1}</p>
              <h2>{topic.title}</h2>
            </div>
            {topic.configuration ? <p>{topic.configuration}</p> : null}
          </div>

          <p>{topic.summary}</p>
          {topic.procedures?.length ? (
            <>
              <h3>How to use it</h3>
              <ol className="chapter-list">
                {topic.procedures.map((procedure, procedureIndex) => (
                  <li key={`${topic.id}-procedure-${procedureIndex}`}>
                    <span className="chapter-number">{String(procedureIndex + 1).padStart(2, "0")}</span>
                    <div><strong>{procedure}</strong></div>
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          {topic.remember?.length ? (
            <div>
              <h3>Remember</h3>
              <ul>{topic.remember.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ) : null}

          {topic.sources?.length ? (
            <p><small>Source · {topic.sources.map((source) => formatSource(source, aircraft)).join(" · ")}</small></p>
          ) : null}
          <LearningCompletionButton
            aircraftId={aircraft.id}
            kind="avionics"
            contentId={topic.id}
            label={`Mark ${topic.title} complete`}
          />
        </section>
      ))}
    </main>
  );
}
