import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftProcedureContent, AircraftProcedure, TrainingSourceReference } from "@/lib/universal-aircraft-content";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export default async function ProceduresPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftProcedureContent>(repository, aircraftId, "procedures"),
    repository.getNormalFlight(aircraftId),
  ]);
  if (!aircraft) notFound();

  const procedures: readonly AircraftProcedure[] = universal?.procedures ?? legacy?.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    summary: "Legacy procedure content retained while this aircraft is migrated to the M9 procedure domain.",
    steps: phase.items.map((item) => ({ id: item.id, action: item.action, rationale: item.why })),
  })) ?? [];
  if (!procedures.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/practice`}>← Practice</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="practice" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Procedures · {aircraft.displayName}</p>
        <h1>{universal?.title ?? "Operating procedures"}</h1>
        <p className="lede">Procedures provide the detail behind concise checklist items: what to do, what to expect, what to verify and why the step matters.</p>
        {universal?.disclaimer ? <p><strong>Training boundary:</strong> {universal.disclaimer}</p> : null}
        {universal?.sourceNote ? <p><small>Source note · {universal.sourceNote}</small></p> : null}
      </section>
      {procedures.map((procedure) => (
        <section className="reference-library" id={procedure.id} key={procedure.id}>
          <div className="section-heading"><div><p className="eyebrow">{procedure.phase ?? "Procedure"}</p><h2>{procedure.title}</h2></div></div>
          {procedure.summary ? <p>{procedure.summary}</p> : null}
          {procedure.prerequisites?.length ? <p><strong>Prerequisites:</strong> {procedure.prerequisites.join(" · ")}</p> : null}
          <ol className="chapter-list">
            {procedure.steps.map((step, index) => {
              const sourceLabel = formatSources(step.sources);
              return (
                <li key={step.id}>
                  <span className="chapter-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{step.action}</strong>
                    {step.expectedResult ? <span>Expected: {step.expectedResult}</span> : null}
                    {step.verification ? <span>Verify: {step.verification}</span> : null}
                    {step.rationale ? <span>Why: {step.rationale}</span> : null}
                    {step.notices?.map((notice, noticeIndex) => <span key={`${step.id}-notice-${noticeIndex}`}><strong>{notice.kind.toUpperCase()}:</strong> {notice.text}</span>)}
                    {sourceLabel ? <span><small>Source · {sourceLabel}</small></span> : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {procedure.completionCriteria?.length ? <p><strong>Complete when:</strong> {procedure.completionCriteria.join(" · ")}</p> : null}
          {formatSources(procedure.sources) ? <p><small>Procedure source · {formatSources(procedure.sources)}</small></p> : null}
        </section>
      ))}
    </main>
  );
}
