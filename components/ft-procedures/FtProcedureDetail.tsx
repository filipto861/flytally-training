"use client";

import type { ContentSourcePolicy } from "@/lib/source-authority";
import type { AircraftProcedureDefinition } from "@/lib/universal-aircraft-content";

import { FtProcedureLearn } from "./FtProcedureLearn";
import { FtProcedureOperate, type FtProcedureOperateProps } from "./FtProcedureOperate";
import { FtProcedureRelevance } from "./FtProcedureRelevance";
import styles from "./ft-procedures.module.css";

export type FtProcedureDetailProps = {
  readonly procedure: AircraftProcedureDefinition;
  readonly sourcePolicy: ContentSourcePolicy | undefined;
  readonly operateProps: FtProcedureOperateProps | undefined;
  readonly completionText?: string;
  readonly onResetProcedure?: () => void;
  readonly previousProcedure?: AircraftProcedureDefinition;
  readonly nextProcedure?: AircraftProcedureDefinition;
  readonly onPreviousProcedure?: () => void;
  readonly onNextProcedure?: () => void;
};

export function FtProcedureDetail({
  procedure,
  sourcePolicy,
  operateProps,
  completionText,
  onResetProcedure,
  previousProcedure,
  nextProcedure,
  onPreviousProcedure,
  onNextProcedure,
}: FtProcedureDetailProps) {
  return (
    <article
      className={styles.detail}
      aria-label={"Procedure: " + procedure.title}
      id={procedure.id}
    >
      <header className={styles.detailHeader}>
        <div>
          <p className={styles.detailEyebrow}>
            NORMAL · {procedure.phase ?? "PROCEDURE"}
          </p>
          <h2>{procedure.title}</h2>
          {procedure.summary ? <p>{procedure.summary}</p> : null}
        </div>

        {completionText || onResetProcedure ? (
          <div className={styles.detailProgress}>
            {completionText ? <span>{completionText}</span> : null}
            {onResetProcedure ? (
              <button type="button" onClick={onResetProcedure}>
                Reset
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={styles.detailLayout}>
        <div className={styles.primaryProcedure}>
          {operateProps ? (
            <FtProcedureOperate {...operateProps} />
          ) : (
            <section className={styles.operateSection} aria-label="Operate">
              <header className={styles.sectionHeader}>
                <p className={styles.sectionLabel}>OPERATE</p>
                <h3>Execute the procedure</h3>
              </header>
              <p className={styles.emptyState}>Procedure execution state is unavailable.</p>
            </section>
          )}

          <FtProcedureLearn procedure={procedure} />
        </div>

        <aside className={styles.contextPanel} aria-label="Procedure context">
          <FtProcedureRelevance procedure={procedure} />

          {sourcePolicy === "available-sources" ? (
            <p className={styles.sourcePolicyWarning} role="note">
              Sources: available training material. Not FAA-approved.
            </p>
          ) : null}
        </aside>
      </div>

      <nav className={styles.navigation} aria-label="Procedure navigation">
        <button
          type="button"
          disabled={!previousProcedure || !onPreviousProcedure}
          onClick={onPreviousProcedure}
          aria-label={
            previousProcedure
              ? "Previous procedure: " + previousProcedure.title
              : "Previous procedure"
          }
        >
          {previousProcedure ? "← " + previousProcedure.title : "← Previous"}
        </button>

        <button
          type="button"
          disabled={!nextProcedure || !onNextProcedure}
          onClick={onNextProcedure}
          aria-label={
            nextProcedure
              ? "Next procedure: " + nextProcedure.title
              : "Next procedure"
          }
        >
          {nextProcedure ? nextProcedure.title + " →" : "Next →"}
        </button>
      </nav>
    </article>
  );
}
