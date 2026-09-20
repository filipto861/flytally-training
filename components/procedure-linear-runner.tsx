"use client";

import { procedureStepKey } from "@/lib/procedure-session";
import type {
  AircraftProcedure,
  TrainingSourceReference,
} from "@/lib/universal-aircraft-content";
import styles from "./procedure-browser.module.css";

const formatSources = (
  sources: readonly TrainingSourceReference[] | undefined,
): string | undefined =>
  sources
    ?.map((item) =>
      [
        item.chapter ? `Ch ${item.chapter}` : undefined,
        item.section,
        `p. ${item.pageLabel}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .join(" · ");

export function ProcedureLinearRunner({
  procedure,
  completedStepKeys,
  onToggleStep,
}: Readonly<{
  procedure: AircraftProcedure;
  completedStepKeys: ReadonlySet<string>;
  onToggleStep: (stepId: string) => void;
}>) {
  return (
    <ol className={styles.steps}>
      {procedure.steps.map((step, index) => {
        const sourceLabel = formatSources(step.sources);
        const stepKey = procedureStepKey(procedure.id, step.id);
        const complete = completedStepKeys.has(stepKey);

        return (
          <li className={complete ? styles.stepComplete : undefined} key={step.id}>
            <button
              className={styles.stepCheck}
              aria-label={`${complete ? "Uncheck" : "Complete"} procedure step ${index + 1}`}
              aria-pressed={complete}
              onClick={() => onToggleStep(step.id)}
              type="button"
            >
              <span aria-hidden="true" />
            </button>
            <span className={styles.stepNumber}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className={styles.stepBody}>
              <strong className={styles.action}>{step.action}</strong>
              {step.expectedResult ? (
                <p>
                  <span>Expected</span>
                  {step.expectedResult}
                </p>
              ) : null}
              {step.verification ? (
                <p>
                  <span>Verify</span>
                  {step.verification}
                </p>
              ) : null}
              {step.rationale ? (
                <p>
                  <span>Why</span>
                  {step.rationale}
                </p>
              ) : null}
              {step.notices?.map((notice, noticeIndex) => (
                <p
                  className={styles[notice.kind]}
                  key={`${step.id}-${notice.kind}-${noticeIndex}`}
                >
                  <span>{notice.kind.toUpperCase()}</span>
                  {notice.text}
                </p>
              ))}
              {sourceLabel ? <small>Source · {sourceLabel}</small> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
