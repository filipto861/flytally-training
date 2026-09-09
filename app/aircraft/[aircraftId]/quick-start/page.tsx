import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { getQuickStartMinutes } from "@/lib/content-metrics";
import { getTrainingContentRepository } from "@/lib/content-store";
import styles from "../learning.module.css";

export default async function QuickStartPage({
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
        <p className="eyebrow">Quick Start · {aircraft.displayName}</p>
        <h1>Know enough to start flying — not enough to lose the evening.</h1>
        <p className="lede">{content.quickStartDescription}</p>
      </section>

      <section className={styles.learningHeader}>
        <p>
          Read this once before the first Cold & Dark session. Every block is deliberately compressed to a simulator mental model; configuration detail stays in the source-backed system lessons and manual.
        </p>
        <span className={styles.timeBadge}>~{getQuickStartMinutes(content)} min total</span>
      </section>

      <div className={styles.quickGrid}>
        {content.quickStart.map((topic) => (
          <article className={styles.quickCard} key={topic.id}>
            <div className={styles.quickTopline}>
              <h2>{topic.title}</h2>
              <span>{topic.minutes} min</span>
            </div>
            <p>{topic.summary}</p>
            <ul className={styles.remember}>
              {topic.remember.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <small className={styles.sourceLine}>
              Source · {topic.source.map((item) => `Ch ${item.chapter} · ${item.section} · p. ${item.manualPage}`).join(" · ")}
            </small>
          </article>
        ))}
      </div>

      <section className={styles.nextStep}>
        <div>
          <h2>Ready to use it?</h2>
          <p>Go straight into the complete Cold & Dark First Flight, or open Essential Systems if one area still feels unclear.</p>
        </div>
        <div>
          <Link href={`/aircraft/${aircraft.id}/cold-dark`}>Start First Flight →</Link>
          <Link href={`/aircraft/${aircraft.id}/systems`}>Essential Systems →</Link>
        </div>
      </section>
    </main>
  );
}
