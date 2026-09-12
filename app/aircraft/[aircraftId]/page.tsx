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

  const hasTraining = capabilities.systems || capabilities.procedures || capabilities.knowledge || capabilities.avionics || capabilities.flows;
  const hasFly = capabilities.checklists || capabilities.performance;
  const hasReference = capabilities.weightBalance || capabilities.limitations || capabilities.abnormalEmergency;

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="pilot-aircraft-home">
        <header className="pilot-home-header">
          <p className="eyebrow">Aircraft workspace</p>
          <h1>{aircraft.displayName}</h1>
        </header>

        <div className="pilot-command-grid">
          {hasFly ? <article className="pilot-command-panel pilot-command-panel-primary">
            <p className="eyebrow">Fly</p>
            <h2>Checklist & performance</h2>
            <p>Operational flight tools only, optimized for quick touch use.</p>
            <Link className="pilot-command-primary" href={moduleHref("fly")}>Open flight deck →</Link>
          </article> : null}

          {hasTraining ? <article className="pilot-command-panel">
            <p className="eyebrow">Learn</p>
            <h2>Learn the aircraft</h2>
            <p>Systems, procedures, checklist practice and explanations.</p>
            <Link className="pilot-command-primary" href={moduleHref("training")}>Open learn →</Link>
          </article> : hasReference ? <article className="pilot-command-panel">
            <p className="eyebrow">Reference</p>
            <h2>Aircraft reference</h2>
            <p>Published limitations, loading and abnormal or emergency material.</p>
            <Link className="pilot-command-primary" href={moduleHref("reference")}>Open reference →</Link>
          </article> : null}
        </div>

        {capabilities.abnormalEmergency ? <Link className="pilot-emergency-strip" href={moduleHref("abnormal")}>
          <span>Abnormal & Emergency</span><span aria-hidden="true">Open quick reference →</span>
        </Link> : null}
      </section>
    </main>
  );
}
