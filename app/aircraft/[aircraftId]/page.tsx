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
    { key: "checklists", title: "Checklists", description: "Flight-phase checklists with Learn, Practice, Flow and Challenge & Response modes.", available: capabilities.checklists, href: "checklists" },
    { key: "procedures", title: "Procedures", description: "Detailed procedures: actions, expected results, verification and short rationale.", available: capabilities.procedures, href: "procedures" },
    { key: "systems", title: "Systems", description: "Controls, indications, normal operation, limitations and abnormal cues for installed systems.", available: capabilities.systems, href: "systems" },
    { key: "performance", title: "Performance", description: "Published performance lookup and reference tables for this aircraft and configuration.", available: capabilities.performance, href: "performance" },
    { key: "limitations", title: "Limitations", description: "Operating limitations, speeds, weights and configuration-specific restrictions.", available: capabilities.limitations, href: "limitations" },
    { key: "abnormal", title: "Abnormal & Emergency", description: "Abnormal and emergency training when this aircraft has published material for it.", available: capabilities.abnormalEmergency, href: "abnormal" },
  ] as const;
  const availableCount = modules.filter(module => module.available).length;

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href="/">← Aircraft library</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" />
      <section className="detail-hero workspace-hero">
        <div>
          <p className="eyebrow">Aircraft training workspace</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">Train the published material for this aircraft. The workspace only exposes modules that apply to the selected type and configuration.</p>
          <div className="hero-facts">{aircraft.variants.length ? <span>Variants {aircraft.variants.join(" · ")}</span> : null}<span>{availableCount} core module{availableCount === 1 ? "" : "s"} currently available</span></div>
        </div>
        {manual ? <aside className="manual-summary compact-summary"><span className="source-pill">Training source</span><h2>{manual.title}</h2><dl><div><dt>Publisher</dt><dd>{manual.publisher}</dd></div><div><dt>Revision</dt><dd>{manual.revision}</dd></div><div><dt>Issue</dt><dd>{manual.issueDate}</dd></div></dl><p>Published training content retains revision-aware source provenance.</p></aside> : null}
      </section>
      <section className="start-panel" aria-labelledby="start-title">
        <div><p className="eyebrow">Start training</p><h2 id="start-title">Use the modules that exist for this aircraft.</h2><p>No system, procedure, equipment item or cockpit module is assumed globally. Each aircraft defines its own training surface.</p></div>
        {capabilities.checklists ? <Link className="primary-action" href={`/aircraft/${aircraft.id}/checklists`}>Open Checklists →</Link> : capabilities.systems ? <Link className="primary-action" href={`/aircraft/${aircraft.id}/systems`}>Open Systems →</Link> : null}
      </section>
      <section className="workspace-overview" aria-label="Available training modules">
        {modules.map((module) => {
          const content = <><div className="workspace-card-topline"><span>{module.title}</span><small>{module.available ? "Available" : "Not published"}</small></div><p>{module.description}</p><strong>{module.available ? "Open →" : "Not used for this aircraft"}</strong></>;
          return module.available ? <Link className="workspace-card" href={`/aircraft/${aircraft.id}/${module.href}`} key={module.key}>{content}</Link> : <article className="workspace-card workspace-card-static" key={module.key}>{content}</article>;
        })}
      </section>
      <section className="reference-library"><p className="eyebrow">Operational note</p><p>FlyTally Training is a learning aid. Current approved aircraft, operator and regulatory documentation remains authoritative for flight operations.</p></section>
    </main>
  );
}
