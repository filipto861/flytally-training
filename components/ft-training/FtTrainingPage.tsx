import Link from "next/link";

import { ScenarioTrainer } from "@/components/scenario-trainer";
import type { RuntimeAbnormalTraining } from "@/lib/abnormal-runtime";
import { withVariantQuery } from "@/lib/aircraft-applicability";

import styles from "./ft-training.module.css";

export type FtTrainingModule = {
  readonly key: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
};

export function FtTrainingPage({
  aircraftId,
  selectedVariant,
  startHere,
  modules,
  scenarioTraining,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  startHere: readonly FtTrainingModule[];
  modules: readonly FtTrainingModule[];
  scenarioTraining?: RuntimeAbnormalTraining;
}>) {
  return (
    <main
      className={styles.trainingPage}
      aria-label="Training workspace"
      data-ft-training-page="true"
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>TRAINING</p>
        <h1>Training</h1>
        <p>Build understanding first, then rehearse source-defined scenarios.</p>
      </header>

      {startHere.length ? (
        <section className={styles.section} aria-labelledby="training-start-heading">
          <div>
            <p className={styles.eyebrow}>START HERE</p>
            <h2 id="training-start-heading">Practical path</h2>
          </div>
          <div className={styles.grid}>
            {startHere.map((module) => (
              <Link
                className={styles.card}
                href={withVariantQuery(module.href, selectedVariant)}
                key={module.key}
              >
                <strong>{module.title}</strong>
                <span>{module.summary}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {modules.length ? (
        <section className={styles.section} aria-labelledby="training-study-heading">
          <div>
            <p className={styles.eyebrow}>STUDY</p>
            <h2 id="training-study-heading">Focused practice</h2>
          </div>
          <div className={styles.grid}>
            {modules.map((module) => (
              <Link
                className={styles.card}
                href={withVariantQuery(module.href, selectedVariant)}
                key={module.key}
              >
                <strong>{module.title}</strong>
                <span>{module.summary}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {scenarioTraining ? (
        <section className={styles.section} aria-labelledby="scenario-training-heading">
          <div>
            <p className={styles.eyebrow}>APPLY</p>
            <h2 id="scenario-training-heading">Scenario training</h2>
            <p className={styles.sectionIntro}>
              Work through source-defined training prompts and debriefs without changing Active Flight.
            </p>
          </div>
          <ScenarioTrainer training={scenarioTraining} />
        </section>
      ) : null}

      <footer className={styles.footer}>
        <Link
          href={withVariantQuery(
            `/aircraft/${aircraftId}/progress-overview`,
            selectedVariant,
          )}
        >
          View training progress →
        </Link>
      </footer>
    </main>
  );
}
