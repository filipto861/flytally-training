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

  const { aircraft, capabilities } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const moduleHref = (href: string) => withVariantQuery(`/aircraft/${aircraft.id}/${href}`, selectedVariant);
  const manualById = (manualId?: string) => manualId ? aircraft.manuals.find((manual) => manual.id === manualId) : undefined;
  const fallbackTrainingManual = aircraft.manuals.find((manual) => !isSimulatorOnlyAuthority(manual.authorityRole)) ?? aircraft.manuals[0];
  const flyManual = manualById(aircraft.workspaceProfile?.flyManualId) ?? fallbackTrainingManual;
  const learnManual = manualById(aircraft.workspaceProfile?.learnManualId)
    ?? aircraft.manuals.find((manual) => !isSimulatorOnlyAuthority(manual.authorityRole) && manual.id !== flyManual?.id)
    ?? fallbackTrainingManual;

  const flyStart = capabilities.checklists ? { href: "checklists", label: "Normal Checklist" }
    : capabilities.performance ? { href: "performance", label: "Performance" }
      : capabilities.abnormalEmergency ? { href: "abnormal", label: "QRH" }
        : capabilities.limitations ? { href: "limitations", label: "Limitations" }
          : undefined;
  const learnStart = capabilities.systems ? { href: "systems", label: "Systems" }
    : capabilities.procedures ? { href: "procedures", label: "Procedures" }
      : capabilities.knowledge ? { href: "knowledge", label: "Knowledge" }
        : capabilities.avionics ? { href: "avionics", label: "Avionics" }
          : capabilities.flows ? { href: "flows", label: "Workflow" }
            : undefined;

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="focused-aircraft-home">
        <p className="eyebrow">Aircraft home</p>
        <h1>{aircraft.displayName}</h1>
        <p className="lede">Choose the mode that matches what you are doing now. Everything else stays out of the way.</p>

        <div className="focused-choice-grid">
          {flyStart ? <Link className="focused-choice" href={moduleHref(flyStart.href)}>
            <small>FLY</small>
            <strong>Cockpit tools</strong>
            <p>Checklist, performance, quick reference and QRH material available for this aircraft.</p>
            <span>Open {flyStart.label} →</span>
          </Link> : null}
          {learnStart ? <Link className="focused-choice" href={moduleHref(learnStart.href)}>
            <small>LEARN</small>
            <strong>Study & practice</strong>
            <p>Systems, procedures and knowledge material for understanding the aircraft.</p>
            <span>Start with {learnStart.label} →</span>
          </Link> : null}
        </div>

        {(flyManual || learnManual) ? <details className="focused-reference">
          <summary>Training references</summary>
          <dl>
            {flyManual ? <div><dt>FLY reference</dt><dd>{flyManual.title} · {flyManual.revision}</dd></div> : null}
            {learnManual ? <div><dt>LEARN reference</dt><dd>{learnManual.title} · {learnManual.revision}</dd></div> : null}
          </dl>
        </details> : null}
      </section>

      <section className="reference-library"><p>Training aid only. Current approved aircraft, operator and regulatory documentation remains authoritative for flight operations.</p></section>
    </main>
  );
}
