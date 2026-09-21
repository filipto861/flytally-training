import Link from "next/link";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import { launchTrainingDestination } from "@/lib/launch/progress";
import type { PersistedTrainingProgressEvent } from "@/lib/progress-events";

import styles from "./ft-launch.module.css";

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function contentLabel(contentId: string): string {
  return contentId.replaceAll("-", " ");
}

export function FtContinueTraining({
  aircraftId,
  selectedVariant,
  latestTraining,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  latestTraining?: PersistedTrainingProgressEvent;
}>) {
  if (!latestTraining) {
    return (
      <section className={styles.continueSection} aria-labelledby="ft-continue-training">
        <div className={styles.continueCopy}>
          <p className={styles.eyebrow}>PRIMARY</p>
          <h2 id="ft-continue-training">Continue Training</h2>
          <p>No training activity yet. Start with the aircraft training workspace.</p>
        </div>
        <Link
          className={styles.primaryAction}
          href={withVariantQuery(`/aircraft/${aircraftId}/training`, selectedVariant)}
        >
          Start training
        </Link>
      </section>
    );
  }

  const destination = launchTrainingDestination(latestTraining);
  const href = withVariantQuery(
    `/aircraft/${aircraftId}/${destination.route}`,
    selectedVariant,
  );

  return (
    <section className={styles.continueSection} aria-labelledby="ft-continue-training">
      <div className={styles.continueCopy}>
        <p className={styles.eyebrow}>PRIMARY</p>
        <h2 id="ft-continue-training">Continue Training</h2>
        <strong className={styles.activityTitle}>{destination.label}</strong>
        <p className={styles.activityContext}>{contentLabel(latestTraining.contentId)}</p>
        <div className={styles.activityMeta}>
          <span>{latestTraining.completed ? "Completed" : "In progress"}</span>
          <time dateTime={latestTraining.occurredAt}>
            {formatActivityDate(latestTraining.occurredAt)}
          </time>
        </div>
      </div>
      <Link className={styles.primaryAction} href={href}>
        Continue training
      </Link>
    </section>
  );
}
