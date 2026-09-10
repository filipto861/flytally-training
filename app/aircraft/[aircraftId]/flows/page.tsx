import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
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

export default async function FlowsPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftFlowsContent>(repository, aircraftId, "flows"),
  ]);
  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}`}>← {aircraft.displayName}</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="flows" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Flows · {aircraft.displayName}</p>
        <h1>{content.title}</h1>
        {content.sourceNote ? <p className="lede">{content.sourceNote}</p> : null}
        {content.disclaimer ? <p><strong>Authority boundary:</strong> {content.disclaimer}</p> : null}
      </section>

      {content.flows.map((flow, flowIndex) => (
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
