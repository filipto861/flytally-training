import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { resolveSelectedVariant, withVariantQuery } from "@/lib/aircraft-applicability";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";

export default async function TrainingHubPage({
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
  const href = (section: string) => withVariantQuery(`/aircraft/${aircraft.id}/${section}`, selectedVariant);

  const modules = [
    capabilities.checklists ? { key: "checklists", kicker: "Checklist", title: "Checklist training", text: "Learn, practise flows and use challenge & response." } : undefined,
    capabilities.systems ? { key: "systems", kicker: "Aircraft", title: "Systems", text: "Understand how systems work and what to monitor." } : undefined,
    capabilities.procedures ? { key: "procedures", kicker: "Operate", title: "Procedures", text: "Work through normal procedures, expected results and verification." } : undefined,
    capabilities.knowledge ? { key: "knowledge", kicker: "Recall", title: "Knowledge", text: "Review memory items, details and weak areas." } : undefined,
    capabilities.avionics ? { key: "avionics", kicker: "Equipment", title: "Avionics", text: "Study avionics installed for the selected configuration." } : undefined,
    capabilities.flows ? { key: "flows", kicker: "Rehearse", title: "Flows", text: "Build repeatable cockpit flows from published procedures." } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string } => Boolean(item));

  if (!modules.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="pilot-area">
        <header className="pilot-area-header">
          <p className="eyebrow">Learn</p>
          <h1>Learn</h1>
          <p className="lede">Study the aircraft away from the cockpit. Pick one area and focus on it.</p>
        </header>
        <div className="pilot-area-grid" aria-label="Learning areas">
          {modules.map((module) => <Link className="pilot-area-card" href={href(module.key)} key={module.key}>
            <small>{module.kicker}</small>
            <strong>{module.title}</strong>
            <p>{module.text}</p>
            <span>Open →</span>
          </Link>)}
        </div>
      </section>
    </main>
  );
}
