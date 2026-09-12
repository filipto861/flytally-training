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

  const trainingStart = capabilities.systems ? { href: "systems", label: "Systems" }
    : capabilities.procedures ? { href: "procedures", label: "Procedures" }
      : capabilities.knowledge ? { href: "knowledge", label: "Knowledge" }
        : capabilities.avionics ? { href: "avionics", label: "Avionics" }
          : capabilities.flows ? { href: "flows", label: "Workflow" }
            : undefined;
  const checklistStart = capabilities.checklists ? { href: "checklists", label: "Normal checklist" }
    : capabilities.abnormalEmergency ? { href: "abnormal", label: "Abnormal / Emergency" }
      : undefined;
  const referenceStart = capabilities.performance && capabilities.limitations
    ? { href: "quick-reference", label: "Quick Reference" }
    : capabilities.performance ? { href: "performance", label: "Performance" }
      : capabilities.weightBalance ? { href: "weight-balance", label: "Weight & Balance" }
        : capabilities.limitations ? { href: "limitations", label: "Limitations" }
          : undefined;

  const primary = trainingStart
    ? { eyebrow: "Training", title: `Start with ${trainingStart.label}`, description: "Build aircraft knowledge through the published training material.", ...trainingStart }
    : checklistStart
      ? { eyebrow: "Checklists", title: checklistStart.label, description: "Open the published checklist material for this aircraft.", ...checklistStart }
      : referenceStart
        ? { eyebrow: "Reference", title: referenceStart.label, description: "Open the published aircraft reference material.", ...referenceStart }
        : undefined;

  const quickLinks = [
    capabilities.checklists ? { href: "checklists", label: "Normal checklist" } : undefined,
    capabilities.abnormalEmergency ? { href: "abnormal", label: "Abnormal / Emergency" } : undefined,
    capabilities.weightBalance ? { href: "weight-balance", label: "Weight & Balance" } : undefined,
    referenceStart,
  ].filter((item): item is { href: string; label: string } => Boolean(item))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    .filter((item) => item.href !== primary?.href);

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="overview" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="pilot-aircraft-home">
        <h1>{aircraft.displayName}</h1>
        <p className="lede">What do you want to do?</p>

        <div className="pilot-home-layout">
          {primary ? <Link className="pilot-primary-card" href={moduleHref(primary.href)}>
            <small>{primary.eyebrow}</small>
            <strong>{primary.title}</strong>
            <p>{primary.description}</p>
            <span>Open →</span>
          </Link> : null}

          {quickLinks.length ? <aside className="pilot-quick-panel" aria-label="Quick access">
            <h2>Quick access</h2>
            <div className="pilot-quick-list">
              {quickLinks.map((item) => <Link href={moduleHref(item.href)} key={item.href}>
                <span>{item.label}</span><span aria-hidden="true">→</span>
              </Link>)}
            </div>
          </aside> : <aside className="pilot-quick-panel"><p className="pilot-empty">Additional published material will appear here when it is available for this aircraft.</p></aside>}
        </div>
      </section>
    </main>
  );
}
