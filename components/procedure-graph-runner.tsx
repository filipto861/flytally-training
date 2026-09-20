"use client";

import {
  getActiveProcedureGraphNode,
  isProcedureGraphComplete,
  type ProcedureGraphExecutionState,
} from "@/lib/procedure-graph-runtime";
import type {
  AircraftGraphProcedure,
  TrainingNotice,
  TrainingSourceReference,
} from "@/lib/universal-aircraft-content";
import styles from "./procedure-graph-runner.module.css";

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

function NodeBadges({
  memoryItem,
  crewRole,
}: Readonly<{
  memoryItem?: boolean;
  crewRole?: string;
}>) {
  if (!memoryItem && !crewRole) return null;
  return (
    <div className={styles.badges}>
      {memoryItem ? (
        <span className={`${styles.badge} ${styles.memoryBadge}`}>MEMORY</span>
      ) : null}
      {crewRole ? <span className={styles.badge}>{crewRole}</span> : null}
    </div>
  );
}

function SourceLabel({
  sources,
}: Readonly<{
  sources: readonly TrainingSourceReference[] | undefined;
}>) {
  const sourceLabel = formatSources(sources);
  return sourceLabel ? <p className={styles.source}>Source · {sourceLabel}</p> : null;
}

function NoticeList({
  notices,
}: Readonly<{
  notices: readonly TrainingNotice[] | undefined;
}>) {
  return notices?.map((notice, index) => {
    const noticeClass =
      notice.kind === "warning"
        ? styles.warningNotice
        : notice.kind === "caution"
          ? styles.cautionNotice
          : styles.noteNotice;
    return (
      <p className={`${styles.notice} ${noticeClass}`} key={`${notice.kind}-${index}`}>
        <span>{notice.kind.toUpperCase()}</span>
        {notice.text}
      </p>
    );
  });
}

export function ProcedureGraphRunner({
  procedure,
  state,
  onAdvance,
  onSelectDecision,
}: Readonly<{
  procedure: AircraftGraphProcedure;
  state: ProcedureGraphExecutionState;
  onAdvance: () => void;
  onSelectDecision: (optionId: string) => void;
}>) {
  const active = getActiveProcedureGraphNode(procedure.graph, state);

  if (!active) {
    return (
      <section className={styles.nodeCard}>
        <strong>Procedure state is unavailable.</strong>
      </section>
    );
  }

  if (isProcedureGraphComplete(procedure.graph, state)) {
    return (
      <section className={styles.completeCard}>
        <strong>Procedure complete ✓</strong>
        {active.kind === "end" && active.label ? <p>{active.label}</p> : null}
        <SourceLabel sources={active.sources} />
      </section>
    );
  }

  if (active.kind === "decision") {
    return (
      <section className={styles.nodeCard}>
        <p className={styles.nodeType}>Decision</p>
        <h3>{active.prompt}</h3>
        <SourceLabel sources={active.sources} />
        <div className={styles.decisionOptions}>
          {active.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectDecision(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (active.kind === "note") {
    return (
      <section className={`${styles.nodeCard} ${styles.noteCard}`}>
        <p className={styles.nodeType}>Note</p>
        <p>{active.text}</p>
        <SourceLabel sources={active.sources} />
        <button className={styles.primaryAction} type="button" onClick={onAdvance}>
          Continue
        </button>
      </section>
    );
  }

  if (active.kind === "reference") {
    return (
      <section className={styles.nodeCard}>
        <NodeBadges memoryItem={active.memoryItem} crewRole={active.crewRole} />
        <p className={styles.nodeType}>Reference</p>
        <strong className={styles.action}>{active.instruction}</strong>
        <ul className={styles.referenceTargets}>
          {active.targets.map((target) => (
            <li
              key={[target.title, target.procedureId, target.sourceLocationText]
                .filter(Boolean)
                .join(":")}
            >
              <strong>{target.title}</strong>
              {target.sourceLocationText ? <small>{target.sourceLocationText}</small> : null}
            </li>
          ))}
        </ul>
        <SourceLabel sources={active.sources} />
        <button className={styles.primaryAction} type="button" onClick={onAdvance}>
          Acknowledge & continue
        </button>
      </section>
    );
  }

  return (
    <section className={styles.nodeCard}>
      <NodeBadges memoryItem={active.memoryItem} crewRole={active.crewRole} />
      <p className={styles.nodeType}>Action</p>
      <strong className={styles.action}>{active.action}</strong>
      {active.conditionText ? (
        <p className={styles.condition}>
          <span>Condition</span>
          {active.conditionText}
        </p>
      ) : null}
      {active.expectedResult ? (
        <p className={styles.detail}>
          <span>Expected</span>
          {active.expectedResult}
        </p>
      ) : null}
      {active.verification ? (
        <p className={styles.detail}>
          <span>Verify</span>
          {active.verification}
        </p>
      ) : null}
      {active.rationale ? (
        <p className={styles.detail}>
          <span>Why</span>
          {active.rationale}
        </p>
      ) : null}
      <NoticeList notices={active.notices} />
      <SourceLabel sources={active.sources} />
      <button className={styles.primaryAction} type="button" onClick={onAdvance}>
        Complete & continue
      </button>
    </section>
  );
}
