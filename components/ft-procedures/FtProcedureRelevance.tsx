"use client";

import {
  formatProcedureSources,
  procedureRelevance,
} from "@/lib/procedure-presentation";
import type { AircraftProcedureDefinition } from "@/lib/universal-aircraft-content";

import styles from "./ft-procedures.module.css";

export type FtProcedureRelevanceProps = {
  readonly procedure: AircraftProcedureDefinition;
};

function ListFact({
  label,
  values,
}: Readonly<{
  label: string;
  values: readonly string[];
}>) {
  if (!values.length) return null;

  return (
    <div className={styles.relevanceRow}>
      <dt>{label}</dt>
      <dd>
        <ul className={styles.relevanceList}>
          {values.map((value, index) => (
            <li key={`${value}-${index}`}>{value}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

export function FtProcedureRelevance({
  procedure,
}: Readonly<FtProcedureRelevanceProps>) {
  const model = procedureRelevance(procedure);
  const sourceLabels = model.sources
    .map((source) => formatProcedureSources([source]))
    .filter((label): label is string => Boolean(label));
  const hasFacts = Boolean(
    model.phase ||
      model.prerequisites.length ||
      model.completionCriteria.length ||
      model.conditionTexts.length ||
      model.crewRoles.length ||
      model.memoryItems.length ||
      sourceLabels.length,
  );

  return (
    <section className={styles.relevanceSection} aria-label="Relevance">
      <header className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>RELEVANCE</p>
        <h3>Source-defined context</h3>
      </header>

      {hasFacts ? (
        <dl className={styles.relevanceFacts}>
          {model.phase ? (
            <div className={styles.relevanceRow}>
              <dt>Phase</dt>
              <dd>{model.phase}</dd>
            </div>
          ) : null}

          <ListFact label="Prerequisites" values={model.prerequisites} />
          <ListFact label="Completion criteria" values={model.completionCriteria} />
          <ListFact label="Conditions" values={model.conditionTexts} />
          <ListFact label="Crew roles" values={model.crewRoles} />
          <ListFact label="Memory items" values={model.memoryItems} />

          <ListFact label="Sources" values={sourceLabels} />
        </dl>
      ) : (
        <p className={styles.emptyState}>
          No source-defined relevance facts published for this procedure.
        </p>
      )}
    </section>
  );
}
