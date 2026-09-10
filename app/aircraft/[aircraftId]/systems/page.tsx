import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { getEssentialSystemsMinutes } from "@/lib/content-metrics";
import { getTrainingContentRepository } from "@/lib/content-store";
import styles from "../learning.module.css";

export default async function EssentialSystemsPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getLearningContent(aircraftId),
  ]);

  if (!aircraft || !content) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={`/aircraft/${aircraft.id}/learn`}>← Learn</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="learn" />

      <section className="workspace-section-hero">
        <p className="eyebrow">Essential Systems · {aircraft.displayName}</p>
        <h1>{content.systems.length} systems. Only the pilot-facing mental model.</h1>
        <p className="lede">
          Open a system when you need it. Each lesson answers the same questions: what is doing the work, what you control, what you monitor, what normal looks like and what is worth remembering.
        </p>
      </section>

      <section className={styles.learningHeader}>
        <p>
          This is not a replacement for the manual. It is a simulator briefing layer built from it. Where configuration changes by variant, serial number or modification status, the lesson must preserve that distinction rather than flatten different aircraft into one false configuration.
        </p>
        <span className={styles.timeBadge}>~{getEssentialSystemsMinutes(content)} min if read end-to-end</span>
      </section>

      <section className={styles.systemsGrid} aria-label={`${aircraft.displayName} essential systems`}>
        {content.systems.map((system, index) => (
          <details className={styles.systemCard} key={system.id} open={index === 0}>
            <summary>
              <strong>{system.title}</strong>
              <span>{system.minutes} min</span>
            </summary>
            <div className={styles.systemBody}>
              <p className={styles.mentalModel}>{system.mentalModel}</p>
              <div className={styles.systemColumns}>
                <div className={styles.systemBlock}>
                  <h3>You control</h3>
                  <ul>{system.pilotControls.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className={styles.systemBlock}>
                  <h3>You monitor</h3>
                  <ul>{system.pilotMonitors.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className={styles.systemBlock}>
                  <h3>Normal picture</h3>
                  <ul>{system.normalPicture.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className={styles.systemBlock}>
                  <h3>Remember</h3>
                  <ul>{system.remember.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              {system.variantNote ? <p className={styles.variantNote}><strong>Configuration note:</strong> {system.variantNote}</p> : null}
              <small className={styles.sourceLine}>
                Source · {system.source.map((item) => `Ch ${item.chapter} · ${item.section} · p. ${item.manualPage}`).join(" · ")}
              </small>
              <LearningCompletionButton aircraftId={aircraft.id} kind="systems" contentId={system.id} label={`Mark ${system.title} complete`} />
            </div>
          </details>
        ))}
      </section>

      <section className={styles.nextStep}>
        <div>
          <h2>Systems are support material.</h2>
          <p>The primary learning path is still operating the aircraft from Cold & Dark to Shutdown.</p>
        </div>
        <Link href={`/aircraft/${aircraft.id}/cold-dark`}>Return to First Flight →</Link>
      </section>
    </main>
  );
}
