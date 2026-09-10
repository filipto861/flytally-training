import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { getPublishedAircraftModule } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import type { AircraftSystemLesson, AircraftSystemsContent, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "../learning.module.css";

type RuntimeSystem = AircraftSystemLesson & {
  readonly minutes?: number;
  readonly sourceLabel?: string;
};

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export default async function SystemsPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, universal, legacy] = await Promise.all([
    repository.getAircraft(aircraftId),
    getPublishedAircraftModule<AircraftSystemsContent>(repository, aircraftId, "systems"),
    repository.getLearningContent(aircraftId),
  ]);
  if (!aircraft) notFound();

  const systems: readonly RuntimeSystem[] = universal ? universal.systems.map((system) => ({
    ...system,
    sourceLabel: formatSources(system.sources),
  })) : legacy?.systems.map((system) => ({
    id: system.id,
    title: system.title,
    summary: system.mentalModel,
    mentalModel: system.mentalModel,
    controls: system.pilotControls,
    indications: system.pilotMonitors,
    normalOperation: system.normalPicture,
    remember: system.remember,
    minutes: system.minutes,
    sourceLabel: system.source.map((item) => `Ch ${item.chapter} · ${item.section} · p. ${item.manualPage}`).join(" · "),
  })) ?? [];
  if (!systems.length) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/learn`}>← Learn</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="learn" />
      <section className="workspace-section-hero">
        <p className="eyebrow">Systems · {aircraft.displayName}</p>
        <h1>{universal?.title ?? `${systems.length} aircraft systems`}</h1>
        <p className="lede">Each lesson focuses on the system model, what the pilot controls, what is indicated, normal operation, limitations and abnormal cues where applicable.</p>
        {universal?.disclaimer ? <p><strong>Training boundary:</strong> {universal.disclaimer}</p> : null}
        {universal?.sourceNote ? <p><small>Source note · {universal.sourceNote}</small></p> : null}
      </section>

      <section className={styles.systemsGrid} aria-label={`${aircraft.displayName} systems`}>
        {systems.map((system, index) => (
          <details className={styles.systemCard} key={system.id} open={index === 0}>
            <summary><strong>{system.title}</strong>{system.minutes ? <span>{system.minutes} min</span> : null}</summary>
            <div className={styles.systemBody}>
              <p className={styles.mentalModel}>{system.mentalModel ?? system.summary}</p>
              <div className={styles.systemColumns}>
                {system.components?.length ? <div className={styles.systemBlock}><h3>Components</h3><ul>{system.components.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.controls?.length ? <div className={styles.systemBlock}><h3>Controls</h3><ul>{system.controls.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.indications?.length ? <div className={styles.systemBlock}><h3>Indications</h3><ul>{system.indications.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.normalOperation?.length ? <div className={styles.systemBlock}><h3>Normal operation</h3><ul>{system.normalOperation.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.limitations?.length ? <div className={styles.systemBlock}><h3>Limitations</h3><ul>{system.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.abnormalCues?.length ? <div className={styles.systemBlock}><h3>Abnormal cues</h3><ul>{system.abnormalCues.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {system.remember?.length ? <div className={styles.systemBlock}><h3>Remember</h3><ul>{system.remember.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              </div>
              {system.sourceLabel ? <small className={styles.sourceLine}>Source · {system.sourceLabel}</small> : null}
              <LearningCompletionButton aircraftId={aircraft.id} kind="systems" contentId={system.id} label={`Mark ${system.title} complete`} />
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}
