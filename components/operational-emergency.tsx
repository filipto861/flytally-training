"use client";

import { useState } from "react";

import type {
  OperationalEmergencyContent,
  OperationalEmergencyNotice,
  OperationalEmergencyScenario,
  OperationalEmergencySource,
} from "@/lib/operational-flight-data";
import styles from "./operational-emergency.module.css";

function noticeClass(kind: OperationalEmergencyNotice["kind"]): string {
  if (kind === "warning") return styles.warning;
  if (kind === "caution") return styles.caution;
  return styles.note;
}

function sourceLabel(source: OperationalEmergencySource): string {
  return [source.manualId, source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`]
    .filter(Boolean)
    .join(" · ");
}

function Notice({ notice }: Readonly<{ notice: OperationalEmergencyNotice }>) {
  return <div className={`${styles.notice} ${noticeClass(notice.kind)}`}>
    <strong>{notice.kind.toUpperCase()}</strong>
    <span>{notice.text}</span>
  </div>;
}

function Scenario({ scenario }: Readonly<{ scenario: OperationalEmergencyScenario }>) {
  const sources = [...new Set(scenario.stages.flatMap((stage) => stage.sources.map(sourceLabel)))];

  return <article className={styles.procedure}>
    <header className={styles.procedureHeader}>
      <div>
        <span>EMERGENCY</span>
        <h1>{scenario.title}</h1>
      </div>
      <div className={styles.meta}>
        <span>{scenario.category}</span>
        <span>{scenario.phase}</span>
      </div>
      {scenario.configurationNote ? <p>{scenario.configurationNote}</p> : null}
    </header>

    {scenario.notices?.length ? <div className={styles.notices}>
      {scenario.notices.map((notice, index) => <Notice key={`${scenario.id}-notice-${index}`} notice={notice} />)}
    </div> : null}

    <div className={styles.stages}>
      {scenario.stages.map((stage) => {
        const immediate = /immediate|memory/i.test(stage.label);
        return <section className={`${styles.stage}${immediate ? ` ${styles.immediate}` : ""}`} key={stage.id}>
          <h2>{stage.label}</h2>
          {stage.notices?.length ? <div className={styles.notices}>
            {stage.notices.map((notice, index) => <Notice key={`${stage.id}-notice-${index}`} notice={notice} />)}
          </div> : null}
          <ol className={styles.actions}>
            {stage.expectedResponse.map((action, index) => <li key={`${stage.id}-action-${index}`}>
              <span>{index + 1}</span>
              <strong>{action}</strong>
            </li>)}
          </ol>
        </section>;
      })}
    </div>

    <details className={styles.authority}>
      <summary>Source &amp; authority</summary>
      {sources.map((source) => <p key={source}>{source}</p>)}
      {scenario.boundaryNote ? <p>{scenario.boundaryNote}</p> : null}
      <p>Current approved aircraft documents remain authoritative.</p>
    </details>
  </article>;
}

export function OperationalEmergency({ emergency }: Readonly<{ emergency: OperationalEmergencyContent }>) {
  const [scenarioId, setScenarioId] = useState(emergency.scenarios[0]?.id ?? "");
  const scenario = emergency.scenarios.find((candidate) => candidate.id === scenarioId) ?? emergency.scenarios[0];
  if (!scenario) return null;

  return <section className={styles.emergency} aria-label="Emergency quick reference">
    <label className={styles.selector}>
      <span>Emergency procedure</span>
      <select aria-label="Emergency procedure" value={scenario.id} onChange={(event) => setScenarioId(event.target.value)}>
        {emergency.scenarios.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
      </select>
    </label>
    <Scenario scenario={scenario} />
  </section>;
}
