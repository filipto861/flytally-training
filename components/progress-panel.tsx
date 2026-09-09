"use client";

import { useEffect, useMemo, useState } from "react";

import { readBrowserProgress } from "@/lib/browser-progress";
import { summarizeProgress, type TrainingProgressEvent } from "@/lib/progress-events";
import styles from "./m6-training.module.css";

const kindLabels: Record<TrainingProgressEvent["kind"], string> = {
  "quick-start": "Quick Start",
  systems: "Systems",
  "normal-flight": "Complete flight",
  "checklist-phase": "Checklist phase",
  scenario: "Scenario",
  knowledge: "Knowledge",
};

export function ProgressPanel({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const [events, setEvents] = useState<TrainingProgressEvent[]>([]);

  useEffect(() => {
    const refresh = () => setEvents(readBrowserProgress(aircraftId));
    refresh();
    window.addEventListener("flytally-training-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("flytally-training-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [aircraftId]);

  const summary = useMemo(() => summarizeProgress(aircraftId, events), [aircraftId, events]);
  const knowledgeEvents = events.filter((event) => event.aircraftId === aircraftId && event.kind === "knowledge");
  const knowledgeCorrect = knowledgeEvents.filter((event) => event.scorePercent === 100).length;
  const knowledgeScore = knowledgeEvents.length ? Math.round((knowledgeCorrect / knowledgeEvents.length) * 100) : null;

  return (
    <section aria-label="Aircraft progress">
      <div className={styles.progressGrid}>
        <article className={styles.progressStat}><span>Attempts</span><strong>{summary.attempts}</strong></article>
        <article className={styles.progressStat}><span>Completed activities</span><strong>{summary.completedActivities}</strong></article>
        <article className={styles.progressStat}><span>Knowledge accuracy</span><strong>{knowledgeScore === null ? "—" : `${knowledgeScore}%`}</strong></article>
      </div>

      <section className={styles.referenceGroup}>
        <h2>Weak areas</h2>
        {summary.weakAreas.length ? (
          <div className={styles.weakList}>{summary.weakAreas.map((area) => <span key={area}>{area}</span>)}</div>
        ) : <p>No weak area has been identified on this device yet.</p>}
      </section>

      <section className={styles.referenceGroup} style={{ marginTop: 14 }}>
        <h2>Recent practice</h2>
        {summary.recent.length ? (
          <div className={styles.recentList}>
            {summary.recent.map((event, index) => (
              <article className={styles.recentItem} key={`${event.occurredAt}:${event.kind}:${event.contentId}:${index}`}>
                <div><strong>{kindLabels[event.kind]}</strong><span>{event.contentId.replaceAll("-", " ")}</span></div>
                <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
        ) : <div className={styles.emptyProgress}>Complete a checklist, scenario or knowledge question and it will appear here.</div>}
      </section>

      <p className={styles.boundary}>M6 stores this progress locally in the browser using an aircraft-agnostic event contract. M7 will persist the same domain events to the FlyTally account for cross-device continuation.</p>
    </section>
  );
}
