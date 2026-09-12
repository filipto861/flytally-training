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
  const quickActions = [
    capabilities.checklists ? { href: "checklists", label: "Normal checklist" } : undefined,
    capabilities.performance ? { href: "performance", label: "Performance" } : undefined,
    capabilities.weightBalance ? { href: "weight-balance", label: "Weight & Balance" } : undefined,
    capabilities.limitations ? { href: "limitations", label: "Limitations" } : undefined,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="pilot-aircraft-home">
        <header className="pilot-home-header">
          <p className="eyebrow">Aircraft workspace</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">Everything for this aircraft in one place: learn it, run the checklist, or open the numbers you need before flight.</p>
        </header>

        <div className="pilot-command-grid">
          {hasTraining ? <article className="pilot-command-panel pilot-command-panel-primary">
            <p className="eyebrow">Training</p>
            <h2>Know the aircraft</h2>
            <p>Systems, procedures and knowledge are grouped into one focused study area instead of another layer of menu choices.</p>
            <Link className="pilot-command-primary" href={moduleHref("training")}>Open training →</Link>
          </article> : null}

          <article className="pilot-command-panel">
            <p className="eyebrow">Before flight</p>
            <h2>Quick actions</h2>
            <p>Open the operational tool directly. No need to remember where it lives in the content structure.</p>
            <div className="pilot-command-list">
              {quickActions.map((item) => <Link href={moduleHref(item.href)} key={item.href}><span>{item.label}</span><span aria-hidden="true">→</span></Link>)}
            </div>
          </article>
        </div>

        {capabilities.abnormalEmergency ? <Link className="pilot-emergency-strip" href={moduleHref("abnormal")}>
          <span>Abnormal & Emergency</span><span aria-hidden="true">Open quick reference →</span>
        </Link> : null}
      </section>
    </main>
  );
}
