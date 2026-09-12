import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";

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

  const hasTraining = capabilities.checklists || capabilities.systems || capabilities.procedures || capabilities.knowledge || capabilities.avionics || capabilities.flows;
  const hasFly = capabilities.checklists || capabilities.performance;
  const hasReference = capabilities.performance || capabilities.weightBalance || capabilities.limitations || capabilities.abnormalEmergency;

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="pilot-aircraft-home">
        <header className="pilot-home-header">
          <p className="eyebrow">Aircraft</p>
          <h1>{aircraft.displayName}</h1>
        </header>

        <div className="pilot-command-grid">
          {hasFly ? <article className="pilot-command-panel pilot-command-panel-primary">
            <p className="eyebrow">In flight</p>
            <h2>Fly</h2>
            <p>Checklist and performance, optimized for quick cockpit use.</p>
            <Link className="pilot-command-primary" href={moduleHref("fly")}>Open Fly →</Link>
          </article> : null}

          {hasTraining ? <article className="pilot-command-panel">
            <p className="eyebrow">Study</p>
            <h2>Learn</h2>
            <p>Systems, procedures and checklist practice away from the cockpit.</p>
            <Link className="pilot-command-primary" href={moduleHref("training")}>Open Learn →</Link>
          </article> : null}

          {hasReference ? <article className="pilot-command-panel">
            <p className="eyebrow">Quick access</p>
            <h2>Reference</h2>
            <p>Performance, limitations, loading and abnormal or emergency material.</p>
            <Link className="pilot-command-primary" href={moduleHref("reference")}>Open Reference →</Link>
          </article> : null}
        </div>

        {capabilities.abnormalEmergency ? <Link className="pilot-emergency-strip" href={moduleHref("abnormal")}>
          <span>Abnormal & Emergency</span><span aria-hidden="true">Open quick reference →</span>
        </Link> : null}
      </section>
    </main>
  );
}
