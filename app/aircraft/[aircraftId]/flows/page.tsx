import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { configurationForAircraftVariant, filterFlowsForConfiguration, resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { sourceAuthorityLabel } from "@/lib/source-authority";
import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import type { AircraftFlowsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";

function formatSource(source: TrainingSourceReference, aircraft: TrainingAircraft): string {
  const registered = aircraft.manuals.find((manual) => manual.id === source.manualId);
  const sourceName = registered?.title ?? source.manualId;
  const authority = registered ? sourceAuthorityLabel(registered.authorityRole) : "Unregistered source";
  const location = [source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`].filter(Boolean).join(" · ");
  return `${authority} · ${sourceName} · ${location}`;
}

export default async function FlowsPage({
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
    getPublishedAircraftModule<AircraftFlowsContent>(repository, aircraftId, "flows"),
  ]);
  if (!aircraft || !content) notFound();

  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const configuredContent = filterFlowsForConfiguration(content, configurationForAircraftVariant(aircraft, selectedVariant));
  if (!configuredContent.flows.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={withVariantQuery(`/aircraft/${aircraft.id}`, selectedVariant)}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="flows" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="workspace-section-hero">
        <p className="eyebrow">Flows · {aircraft.displayName}{selectedVariant ? ` · ${selectedVariant}` : ""}</p>
        <h1>{configuredContent.title}</h1>
        {configuredContent.sourceNote ? <p className="lede">{configuredContent.sourceNote}</p> : null}
        {configuredContent.disclaimer ? <p><strong>Authority boundary:</strong> {configuredContent.disclaimer}</p> : null}
      </section>

      {configuredContent.flows.map((flow, flowIndex) => (
        <section className="reference-library" id={flow.id} key={flow.id}>
          <div className="section-heading">
            <div><p className="eyebrow">{flow.phase ?? `Flow ${flowIndex + 1}`}</p><h2>{flow.title}</h2></div>
            {flow.applicability?.variants?.length ? <p>Applies to: {flow.applicability.variants.join(" · ")}</p> : null}
          </div>
          {flow.applicability?.note ? <p>{flow.applicability.note}</p> : null}
          <ol className="chapter-list">
            {flow.steps.map((step, index) => (
              <li key={step.id}>
                <span className="chapter-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.action}</strong>
                  {step.verification ? <span>Verify: {step.verification}</span> : null}
                  {step.sources?.map((source, sourceIndex) => <small key={`${step.id}-source-${sourceIndex}`}>Source · {formatSource(source, aircraft)}</small>)}
                </div>
              </li>
            ))}
          </ol>
          {flow.sources?.length ? <p><small>Flow basis · {flow.sources.map((source) => formatSource(source, aircraft)).join(" · ")}</small></p> : null}
          <LearningCompletionButton aircraftId={aircraft.id} kind="flow" contentId={flow.id} label={`Mark ${flow.title} complete`} />
        </section>
      ))}
    </main>
  );
}
