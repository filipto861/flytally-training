import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function AircraftPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const bundle = await getAircraftContentBundle(getTrainingContentRepository(), aircraftId);
  if (!bundle) notFound();

  const { aircraft, capabilities } = bundle;
  const manual = aircraft.manuals[0];
  const modules = [
    { key: "checklists", title: "Checklists", description: "Operational flight-phase checklists with Run, Learn, Practice, Flow and Challenge & Response modes.", available: capabilities.checklists, href: "checklists" },
    { key: "procedures", title: "Procedures", description: "Detailed procedures with actions, expected results, verification and rationale.", available: capabilities.procedures, href: "procedures" },
    { key: "performance", title: "Performance", description: "Published performance lookup and reference tables driven by source data.", available: capabilities.performance, href: "performance" },
    { key: "limitations", title: "Limitations", description: "Operating limitations, speeds, weights and configuration-specific restrictions.", available: capabilities.limitations, href: "limitations" },
    { key: "systems", title: "Systems", description: "Controls, indications, normal operation, limitations and abnormal cues for installed systems.", available: capabilities.systems, href: "systems" },
    { key: "abnormal", title: "Abnormal & Emergency", description: "Abnormal and emergency training when published for this aircraft.", available: capabilities.abnormalEmergency, href: "abnormal" },
    { key: "knowledge", title: "Knowledge", description: "Source-backed questions and explanations for recall and weak-area review.", available: capabilities.knowledge, href: "knowledge" },
  ] as const;
  const availableModules = modules.filter((module) => module.available);

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href="/">← Aircraft library</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" />
      <section className="detail-hero workspace-hero">
        <div>
          <p className="eyebrow">Aircraft training workspace</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">Train the published material for this aircraft. Modules that are not published or do not apply are simply absent from the workspace.</p>
          <div className="hero-facts">{aircraft.variants.length ? <span>Variants {aircraft.variants.join(" · ")}</span> : null}<span>{availableModules.length} module{availableModules.length === 1 ? "" : "s"} currently available</span></div>
        </div>
        {manual ? <aside className="manual-summary compact-summary"><span className="source-pill">Training source</span><h2>{manual.title}</h2><dl><div><dt>Publisher</dt><dd>{manual.publisher}</dd></div><div><dt>Revision</dt><dd>{manual.revision}</dd></div><div><dt>Issue</dt><dd>{manual.issueDate}</dd></div></dl><p>Published training content retains revision-aware source provenance.</p></aside> : null}
      </section>
      <section className="start-panel" aria-labelledby="start-title">
        <div><p className="eyebrow">Start training</p><h2 id="start-title">Open the material you need.</h2><p>The aircraft defines its own module set. FlyTally does not assume systems or procedures that are not present on the type.</p></div>
        {capabilities.checklists ? <Link className="primary-action" href={`/aircraft/${aircraft.id}/checklists`}>Open Checklists →</Link> : capabilities.procedures ? <Link className="primary-action" href={`/aircraft/${aircraft.id}/procedures`}>Open Procedures →</Link> : capabilities.systems ? <Link className="primary-action" href={`/aircraft/${aircraft.id}/systems`}>Open Systems →</Link> : null}
      </section>
      <section className="workspace-overview" aria-label="Available training modules">
        {availableModules.map((module) => <Link className="workspace-card" href={`/aircraft/${aircraft.id}/${module.href}`} key={module.key}><div className="workspace-card-topline"><span>{module.title}</span><small>Available</small></div><p>{module.description}</p><strong>Open →</strong></Link>)}
      </section>
      <section className="reference-library"><p className="eyebrow">Operational note</p><p>FlyTally Training is a learning aid. Current approved aircraft, operator and regulatory documentation remains authoritative for flight operations.</p></section>
    </main>
  );
}
