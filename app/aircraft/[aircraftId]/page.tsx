import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isSimulatorOnlyAuthority } from "@/lib/source-authority";

export default async function AircraftPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const bundle = await getAircraftContentBundle(getTrainingContentRepository(), aircraftId);
  if (!bundle) notFound();

  const { aircraft, capabilities, referenceKnowledge } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const manualById = (manualId?: string) => manualId ? aircraft.manuals.find((manual) => manual.id === manualId) : undefined;
  const fallbackTrainingManual = aircraft.manuals.find((manual) => !isSimulatorOnlyAuthority(manual.authorityRole)) ?? aircraft.manuals[0];
  const flyManual = manualById(aircraft.workspaceProfile?.flyManualId) ?? fallbackTrainingManual;
  const learnManual = manualById(aircraft.workspaceProfile?.learnManualId) ?? fallbackTrainingManual;
  const moduleHref = (href: string) => withVariantQuery(`/aircraft/${aircraft.id}/${href}`, selectedVariant);

  const flyModules = [
    { key: "normal", title: "Normal Checklist", description: "The practical phase-by-phase cockpit checklist used to conduct the flight.", available: capabilities.checklists, href: "checklists", cue: "PRIMARY" },
    { key: "performance", title: "Performance", description: "Takeoff, climb/cruise and landing reference data with source-defined lookup only.", available: capabilities.performance, href: "performance", cue: "FLIGHT DATA" },
    { key: "quick-reference", title: "Quick Reference", description: "Speeds, limits and high-frequency reference items without reopening a full lesson.", available: Boolean(referenceKnowledge) || capabilities.limitations, href: referenceKnowledge ? "quick-reference" : "limitations", cue: "QUICK LOOK" },
    { key: "abnormal", title: "QRH · Abnormal & Emergency", description: "Fast access to published abnormal and emergency procedures and recognition cues.", available: capabilities.abnormalEmergency, href: "abnormal", cue: "QRH" },
  ] as const;

  const learnModules = [
    { key: "systems", title: "Systems", description: "Understand how the aircraft works: components, controls, indications, limits and failure cues.", available: capabilities.systems, href: "systems" },
    { key: "procedures", title: "Procedures", description: "Expanded how-and-why procedures with expected indications, verification and rationale.", available: capabilities.procedures, href: "procedures" },
    { key: "limitations", title: "Limitations", description: "Study operating limitations, configuration restrictions, speeds and weights in context.", available: capabilities.limitations, href: "limitations" },
    { key: "knowledge", title: "Knowledge & Review", description: "Source-backed questions for recall, review and weak-area training.", available: capabilities.knowledge, href: "knowledge" },
    { key: "avionics", title: "Avionics / Implementation", description: "Installation-specific avionics and modeled-control familiarization with explicit source authority.", available: capabilities.avionics, href: "avionics" },
  ] as const;

  const supplementaryModules = [
    { key: "flows", title: "Supplementary Workflow", description: "Lower-authority or simulator-specific workflow material kept separate from the primary CAE normal checklist.", available: capabilities.flows, href: "flows" },
  ] as const;

  const availableFly = flyModules.filter((module) => module.available);
  const availableLearn = learnModules.filter((module) => module.available);
  const availableSupplementary = supplementaryModules.filter((module) => module.available);
  const totalAvailable = new Set([...availableFly, ...availableLearn, ...availableSupplementary].map((module) => module.key)).size;

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href="/">← Aircraft library</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="detail-hero workspace-hero">
        <div>
          <p className="eyebrow">Pilot workspace</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">Two jobs, kept separate: <strong>FLY</strong> for the material you need to conduct the flight, and <strong>LEARN</strong> for understanding and mastering the aircraft.</p>
          <div className="hero-facts">
            {selectedVariant ? <span>Selected variant {selectedVariant}</span> : aircraft.variants.length ? <span>{aircraft.variants.length} variants available</span> : null}
            <span>{totalAvailable} pilot tools currently available</span>
          </div>
        </div>
        {flyManual ? <aside className="manual-summary compact-summary"><span className="source-pill">Primary FLY reference</span><h2>{flyManual.title}</h2><dl><div><dt>Publisher</dt><dd>{flyManual.publisher}</dd></div><div><dt>Revision / issue</dt><dd>{flyManual.revision}</dd></div><div><dt>Authority</dt><dd>Training reference</dd></div></dl><p>Used as the primary practical cockpit reference where its content applies. Approved aircraft/operator documents remain controlling.</p></aside> : null}
      </section>

      <section className="start-panel" aria-labelledby="pilot-start-title">
        <div>
          <p className="eyebrow">Choose your job</p>
          <h2 id="pilot-start-title">Flying now, or learning the airplane?</h2>
          <p>FLY removes study clutter and prioritizes checklist, performance and QRH access. LEARN keeps the explanations, systems and review material.</p>
        </div>
        <div className="state-actions">
          {capabilities.checklists ? <Link className="primary-action" href={moduleHref("checklists")}>FLY · Open Normal Checklist →</Link> : null}
          {capabilities.systems ? <Link className="state-primary" href={moduleHref("systems")}>LEARN · Start Systems →</Link> : capabilities.procedures ? <Link className="state-primary" href={moduleHref("procedures")}>LEARN · Start Procedures →</Link> : null}
        </div>
      </section>

      {availableFly.length ? <section aria-labelledby="fly-title">
        <div className="section-heading">
          <div><p className="eyebrow">FLY</p><h2 id="fly-title">Cockpit tools</h2></div>
          <p>Fast, phase-oriented material intended to be usable during preparation and flight.</p>
        </div>
        <div className="workspace-overview" aria-label="FLY cockpit tools">
          {availableFly.map((module) => <Link className="workspace-card" href={moduleHref(module.href)} key={module.key}><div className="workspace-card-topline"><span>{module.title}</span><small>{module.cue}</small></div><p>{module.description}</p><strong>Open →</strong></Link>)}
        </div>
      </section> : null}

      {availableLearn.length ? <section aria-labelledby="learn-title">
        <div className="section-heading">
          <div><p className="eyebrow">LEARN</p><h2 id="learn-title">Aircraft knowledge</h2></div>
          <p>{learnManual ? `${learnManual.title} is the primary deep-learning source; practical CAE material is cross-linked where relevant.` : "Study the published source-backed aircraft material."}</p>
        </div>
        <div className="workspace-overview" aria-label="LEARN training modules">
          {availableLearn.map((module) => <Link className="workspace-card" href={moduleHref(module.href)} key={module.key}><div className="workspace-card-topline"><span>{module.title}</span><small>LEARN</small></div><p>{module.description}</p><strong>Study →</strong></Link>)}
        </div>
      </section> : null}

      {availableSupplementary.length ? <section aria-labelledby="supplement-title">
        <div className="section-heading">
          <div><p className="eyebrow">Supplementary</p><h2 id="supplement-title">Implementation & workflow aids</h2></div>
          <p>These sources remain explicitly below the primary CAE/FlightSafety training references and never silently override them.</p>
        </div>
        <div className="workspace-overview" aria-label="Supplementary training material">
          {availableSupplementary.map((module) => <Link className="workspace-card" href={moduleHref(module.href)} key={module.key}><div className="workspace-card-topline"><span>{module.title}</span><small>SUPPLEMENT</small></div><p>{module.description}</p><strong>Open →</strong></Link>)}
        </div>
      </section> : null}

      <section className="reference-library"><p className="eyebrow">Operational boundary</p><p>FlyTally Training is a learning and reference aid. Current approved aircraft, operator and regulatory documentation remains authoritative for flight operations.</p></section>
    </main>
  );
}
