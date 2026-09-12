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
    capabilities.checklists ? { key: "checklists", kicker: "Practice", title: "Checklist training", text: "Learn the checklist, practise flows and use challenge & response away from the flight deck." } : undefined,
    capabilities.systems ? { key: "systems", kicker: "Understand", title: "Systems", text: "Learn how the aircraft systems work, what to monitor and what matters operationally." } : undefined,
    capabilities.procedures ? { key: "procedures", kicker: "Operate", title: "Procedures", text: "Walk through normal procedures in the same sequence you use around and inside the aircraft." } : undefined,
    capabilities.knowledge ? { key: "knowledge", kicker: "Recall", title: "Knowledge", text: "Test the details that should be available from memory before and during operation." } : undefined,
    capabilities.avionics ? { key: "avionics", kicker: "Use", title: "Avionics", text: "Study the published avionics material for the selected aircraft configuration." } : undefined,
    capabilities.flows ? { key: "flows", kicker: "Practice", title: "Workflow", text: "Build repeatable cockpit flows from source-backed aircraft procedures." } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string } => Boolean(item));

  if (!modules.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="pilot-area">
        <header className="pilot-area-header">
          <p className="eyebrow">Learn · {aircraft.displayName}</p>
          <h1>Learn the aircraft</h1>
          <p className="lede">Detailed training, explanations and practice live here. The Fly section stays operational and distraction-free.</p>
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
