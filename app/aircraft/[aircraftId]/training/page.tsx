import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { FtTrainingPage, type FtTrainingModule } from "@/components/ft-training/FtTrainingPage";
import {
  configurationForAircraftVariant,
  resolveSelectedVariant,
  withVariantQuery,
} from "@/lib/aircraft-applicability";
import {
  getAircraftContentBundle,
  getPublishedAircraftModule,
} from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { resolveTrainingScenarioContent } from "@/lib/training-scenario-presentation";

export default async function TrainingHubPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  const repository = getTrainingContentRepository();
  const [bundle, publishedAbnormal] = await Promise.all([
    getAircraftContentBundle(repository, aircraftId),
    getPublishedAircraftModule<unknown>(repository, aircraftId, "abnormal"),
  ]);
  if (!bundle) notFound();
  const { aircraft, capabilities } = bundle;
  const selectedVariant = resolveSelectedVariant(variant, aircraft.variants);
  const href = (section: string) => withVariantQuery(`/aircraft/${aircraft.id}/${section}`, selectedVariant);

  const startHere = [
    capabilities.quickStart ? { key: "quick-start", kicker: "Start", title: "Quick Start", text: "Build the minimum mental model before your first cockpit session." } : undefined,
    capabilities.cockpitOrientation ? { key: "orientation", kicker: "Cockpit", title: "Cockpit orientation", text: "Know which panel to look at before you hunt for a control." } : undefined,
    capabilities.checklists ? { key: "checklists", kicker: "First flight", title: "Checklist training", text: "Take the aircraft from Cold & Dark through the complete normal flow." } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string } => Boolean(item));

  const modules = [
    capabilities.systems ? { key: "systems", kicker: "Aircraft", title: "Systems", text: "Understand what each system does, what you control and what you monitor." } : undefined,
    capabilities.procedures ? { key: "procedures", kicker: "Operate", title: "Procedures", text: "Practise published procedures and expected results." } : undefined,
    capabilities.flows ? { key: "flows", kicker: "Rehearse", title: "Flows", text: "Build repeatable cockpit flows from published procedures." } : undefined,
    capabilities.avionics ? { key: "avionics", kicker: "Equipment", title: "Avionics", text: "Study avionics installed for the selected configuration." } : undefined,
    capabilities.knowledge ? { key: "knowledge", kicker: "Recall", title: "Knowledge", text: "Check recall and identify weak areas." } : undefined,
  ].filter((item): item is { key: string; kicker: string; title: string; text: string } => Boolean(item));

  if (!startHere.length && !modules.length) notFound();

  if (isNewShellEnabled()) {
    const configuration = configurationForAircraftVariant(aircraft, selectedVariant);
    const scenarioTraining = resolveTrainingScenarioContent(
      publishedAbnormal,
      configuration,
    );

    const toFtModule = (
      item: { key: string; title: string; text: string },
    ): FtTrainingModule => ({
      key: item.key,
      title: item.title,
      summary: item.text,
      href: `/aircraft/${aircraft.id}/${item.key}`,
    });

    return (
      <FtTrainingPage
        aircraftId={aircraft.id}
        selectedVariant={selectedVariant}
        startHere={startHere.map(toFtModule)}
        modules={modules.map(toFtModule)}
        scenarioTraining={scenarioTraining}
      />
    );
  }

  return (
    <main className="shell aircraft-detail">
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />
      <section className="pilot-area">
        <header className="pilot-area-header">
          <p className="eyebrow">Learn</p>
          <h1>Learn</h1>
          <p className="lede">Start with the practical path, then focus on one area at a time.</p>
        </header>
        {startHere.length ? <section className="training-hub-section">
          <div className="training-hub-heading"><p className="eyebrow">START HERE</p><h2>Practical path</h2></div>
          <div className="pilot-area-grid training-start-grid" aria-label="Start here">
            {startHere.map((module,index) => <Link className={`pilot-area-card${index===0?" pilot-area-card-featured":""}`} href={href(module.key)} key={module.key}>
              <small>{module.kicker}</small><strong>{module.title}</strong><p>{module.text}</p><span>{index===0?"Start":"Open"} →</span>
            </Link>)}
          </div>
        </section> : null}
        {modules.length ? <section className="training-hub-section">
          <div className="training-hub-heading"><p className="eyebrow">STUDY BY AREA</p><h2>Focused practice</h2></div>
          <div className="pilot-area-grid" aria-label="Learning areas">
            {modules.map((module) => <Link className="pilot-area-card" href={href(module.key)} key={module.key}>
              <small>{module.kicker}</small><strong>{module.title}</strong><p>{module.text}</p><span>Open →</span>
            </Link>)}
          </div>
        </section> : null}
        <div className="training-progress-link"><span>Want to see what you have completed or what needs another pass?</span><Link href={href("progress-overview")}>View progress →</Link></div>
      </section>
    </main>
  );
}
