"use client";

import {
  formatProcedureSources,
  procedureLearnProjection,
  type ProcedureLearnNode,
  type ProcedureLearnStep,
} from "@/lib/procedure-presentation";
import type {
  AircraftProcedureDefinition,
  TrainingNotice,
} from "@/lib/universal-aircraft-content";

import styles from "./ft-procedures.module.css";

export type FtProcedureLearnProps = {
  readonly procedure: AircraftProcedureDefinition;
};

function NoticeList({
  notices,
}: Readonly<{
  notices: readonly TrainingNotice[] | undefined;
}>) {
  if (!notices?.length) return null;

  return (
    <div className={styles.noticeList}>
      {notices.map((notice, index) => {
        const noticeClass =
          notice.kind === "warning"
            ? styles.warningNotice
            : notice.kind === "caution"
              ? styles.cautionNotice
              : styles.noteNotice;

        return (
          <p
            className={`${styles.notice} ${noticeClass}`}
            key={`${notice.kind}-${index}`}
          >
            <span>{notice.kind.toUpperCase()}</span>
            {notice.text}
          </p>
        );
      })}
    </div>
  );
}

function LearnDetails({
  expectedResult,
  verification,
  rationale,
  conditionText,
  crewRole,
  memoryItem,
}: Readonly<{
  expectedResult?: string;
  verification?: string;
  rationale?: string;
  conditionText?: string;
  crewRole?: string;
  memoryItem?: boolean;
}>) {
  const rows: Array<readonly [string, string] | undefined> = [
    expectedResult ? ["Expected", expectedResult] : undefined,
    verification ? ["Verify", verification] : undefined,
    rationale ? ["Why", rationale] : undefined,
    conditionText ? ["Condition", conditionText] : undefined,
    crewRole ? ["Crew role", crewRole] : undefined,
    memoryItem === true ? ["Memory", "Memory item"] : undefined,
  ];
  const visibleRows = rows.filter(
    (row): row is readonly [string, string] => Boolean(row),
  );

  if (!visibleRows.length) return null;

  return (
    <dl className={styles.learnDetails}>
      {visibleRows.map(([label, value]) => (
        <div className={styles.detailRow} key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SourceText({
  sources,
}: Readonly<{
  sources: ProcedureLearnStep["sources"] | ProcedureLearnNode["sources"];
}>) {
  const sourceLabel = formatProcedureSources(sources);
  return sourceLabel ? <p className={styles.sourceText}>Source · {sourceLabel}</p> : null;
}

function LinearStep({
  step,
  index,
}: Readonly<{
  step: ProcedureLearnStep;
  index: number;
}>) {
  return (
    <li className={styles.learnStep}>
      <p className={styles.learnNodeKind}>STEP {String(index + 1).padStart(2, "0")}</p>
      <h4 className={styles.learnHeading}>{step.action}</h4>
      <LearnDetails
        expectedResult={step.expectedResult}
        verification={step.verification}
        rationale={step.rationale}
      />
      <NoticeList notices={step.notices} />
      <SourceText sources={step.sources} />
    </li>
  );
}

function GraphNode({
  node,
}: Readonly<{
  node: ProcedureLearnNode;
}>) {
  switch (node.kind) {
    case "ACTION":
      return (
        <li className={styles.learnNode}>
          <p className={styles.learnNodeKind}>ACTION</p>
          <h4 className={styles.learnHeading}>{node.action}</h4>
          <LearnDetails
            expectedResult={node.expectedResult}
            verification={node.verification}
            rationale={node.rationale}
            conditionText={node.conditionText}
            crewRole={node.crewRole}
            memoryItem={node.memoryItem}
          />
          <NoticeList notices={node.notices} />
          <SourceText sources={node.sources} />
        </li>
      );

    case "DECISION":
      return (
        <li className={styles.learnNode}>
          <p className={styles.learnNodeKind}>DECISION</p>
          <h4 className={styles.learnHeading}>{node.prompt}</h4>
          <ul className={styles.optionList}>
            {node.options.map((option) => (
              <li key={option.id}>
                <strong>{option.label}</strong>
                <span>Target · {option.targetNodeId}</span>
              </li>
            ))}
          </ul>
          <SourceText sources={node.sources} />
        </li>
      );

    case "NOTE":
      return (
        <li className={styles.learnNode}>
          <p className={styles.learnNodeKind}>NOTE</p>
          <h4 className={styles.learnHeading}>Note</h4>
          <p className={styles.learnText}>{node.text}</p>
          <SourceText sources={node.sources} />
        </li>
      );

    case "REFERENCE":
      return (
        <li className={styles.learnNode}>
          <p className={styles.learnNodeKind}>REFERENCE</p>
          <h4 className={styles.learnHeading}>{node.instruction}</h4>
          <LearnDetails crewRole={node.crewRole} memoryItem={node.memoryItem} />
          <ul className={styles.targetList}>
            {node.targets.map((target, index) => (
              <li
                key={`${target.title}-${target.procedureId ?? ""}-${target.sourceLocationText ?? ""}-${index}`}
              >
                <strong>{target.title}</strong>
                {target.procedureId ? <span>Procedure · {target.procedureId}</span> : null}
                {target.sourceLocationText ? <span>{target.sourceLocationText}</span> : null}
              </li>
            ))}
          </ul>
          <SourceText sources={node.sources} />
        </li>
      );

    case "END":
      return (
        <li className={styles.learnNode}>
          <p className={styles.learnNodeKind}>END</p>
          <h4 className={styles.learnHeading}>{node.label ?? "End"}</h4>
          <SourceText sources={node.sources} />
        </li>
      );
  }
}

export function FtProcedureLearn({ procedure }: Readonly<FtProcedureLearnProps>) {
  const model = procedureLearnProjection(procedure);

  return (
    <section className={styles.learnSection} aria-label="Learn">
      <header className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>LEARN</p>
        <h3>Understand the procedure</h3>
      </header>

      {model.kind === "linear" ? (
        <ol className={styles.learnList}>
          {model.steps.map((step, index) => (
            <LinearStep key={step.id} step={step} index={index} />
          ))}
        </ol>
      ) : (
        <ol className={styles.learnList}>
          {model.nodes.map((node) => (
            <GraphNode key={node.id} node={node} />
          ))}
        </ol>
      )}
    </section>
  );
}
