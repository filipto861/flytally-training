import Link from "next/link";
import { notFound } from "next/navigation";

import { AircraftWorkspaceNav } from "@/components/aircraft-workspace-nav";
import { LearningCompletionButton } from "@/components/learning-completion-button";
import { getQuickStartMinutes } from "@/lib/content-metrics";
import { getTrainingContentRepository } from "@/lib/content-store";
import { resolveSelectedVariant,withVariantQuery } from "@/lib/aircraft-applicability";
import styles from "../learning.module.css";

export default async function QuickStartPage({
  params,
  searchParams,
}: Readonly<{ params: Promise<{ aircraftId: string }>; searchParams: Promise<{variant?:string}> }>) {
  const [{ aircraftId },{variant}] = await Promise.all([params,searchParams]);
  const repository = getTrainingContentRepository();
  const [aircraft, content] = await Promise.all([
    repository.getAircraft(aircraftId),
    repository.getLearningContent(aircraftId),
  ]);

  if (!aircraft || !content) notFound();
  const selectedVariant=resolveSelectedVariant(variant,aircraft.variants);
  const href=(path:string)=>withVariantQuery(`/aircraft/${aircraft.id}/${path}`,selectedVariant);

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href={href("training")}>← Learn</Link>
      <AircraftWorkspaceNav aircraftId={aircraft.id} active="training" variants={aircraft.variants} variantProfiles={aircraft.variantProfiles} selectedVariant={selectedVariant} />

      <section className="workspace-section-hero">
        <p className="eyebrow">Learn</p>
        <h1>Quick Start</h1>
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
            <details className="pilot-source-details">
              <summary>Source</summary>
              <p>{topic.source.map((item) => `Ch ${item.chapter} · ${item.section} · p. ${item.manualPage}`).join(" · ")}</p>
            </details>
          </article>
        ))}
      </div>

      <LearningCompletionButton aircraftId={aircraft.id} kind="quick-start" contentId="quick-start" label="Mark Quick Start complete" />

      <section className={styles.nextStep}>
        <div>
          <h2>Ready to use it?</h2>
          <p>Go straight into the complete Cold & Dark First Flight, or open Essential Systems if one area still feels unclear.</p>
        </div>
        <div>
          <Link href={href("checklists")}>Start First Flight →</Link>
          <Link href={href("systems")}>Essential Systems →</Link>
        </div>
      </section>
    </main>
  );
}
