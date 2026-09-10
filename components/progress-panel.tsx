"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { loadTrainingProgress } from "@/lib/browser-progress";
import { summarizeProgress, type PersistedTrainingProgressEvent } from "@/lib/progress-events";
import styles from "./m6-training.module.css";

const kindLabels: Record<PersistedTrainingProgressEvent["kind"], string> = {
  "quick-start": "Quick Start",
  systems: "Systems",
  orientation: "Cockpit orientation",
  "normal-flight": "Complete flight",
  "checklist-phase": "Checklist phase",
  scenario: "Scenario",
  knowledge: "Knowledge",
};

export function ProgressPanel({ aircraftId }: Readonly<{ aircraftId: string }>) {
  const [events, setEvents] = useState<readonly PersistedTrainingProgressEvent[]>([]);
  const [persistence, setPersistence] = useState<"loading" | "account" | "local">("loading");
  const [lastContentId, setLastContentId] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const result = await loadTrainingProgress(aircraftId);
      if (!active) return;
      setEvents(result.events);
      setPersistence(result.persistence);
      setLastContentId(result.lastContentId);
    };
    void refresh();
    const localRefresh = () => { void refresh(); };
    window.addEventListener("flytally-training-progress", localRefresh);
    window.addEventListener("storage", localRefresh);
    return () => {
      active = false;
      window.removeEventListener("flytally-training-progress", localRefresh);
      window.removeEventListener("storage", localRefresh);
    };
  }, [aircraftId]);

  const summary = useMemo(() => summarizeProgress(aircraftId, events), [aircraftId, events]);
  const knowledgeEvents = events.filter((event) => event.aircraftId === aircraftId && event.kind === "knowledge");
  const knowledgeCorrect = knowledgeEvents.filter((event) => event.scorePercent === 100).length;
  const knowledgeScore = knowledgeEvents.length ? Math.round((knowledgeCorrect / knowledgeEvents.length) * 100) : null;

  return (
    <section aria-label="Aircraft progress">
      <section className={styles.referenceGroup}>
        <h2>{persistence === "account" ? "FlyTally account sync" : persistence === "loading" ? "Checking progress sync…" : "Local progress"}</h2>
        {persistence === "account" ? (
          <>
            <p>Your progress is backed by the Training PostgreSQL store and can continue on another signed-in device.</p>
            <form action="/api/auth/logout" method="post"><button className={styles.progressTextButton} type="submit">Sign out</button></form>
          </>
        ) : persistence === "local" ? (
          <p>This device keeps working locally. <Link href={`/api/auth/flytally/start?next=${encodeURIComponent(`/aircraft/${aircraftId}/progress-overview`)}`}>Sign in with FlyTally</Link> to migrate these events and enable cross-device continuation.</p>
        ) : <p>Loading the most recent aircraft state.</p>}
        {lastContentId ? <p><strong>Last activity:</strong> {lastContentId.replaceAll("-", " ")}</p> : null}
      </section>

      <div className={styles.progressGrid}>
        <article className={styles.progressStat}><span>Attempts</span><strong>{summary.attempts}</strong></article>
        <article className={styles.progressStat}><span>Completed activities</span><strong>{summary.completedActivities}</strong></article>
        <article className={styles.progressStat}><span>Knowledge accuracy</span><strong>{knowledgeScore === null ? "—" : `${knowledgeScore}%`}</strong></article>
      </div>

      <section className={styles.referenceGroup}>
        <h2>Weak areas</h2>
        {summary.weakAreas.length ? <div className={styles.weakList}>{summary.weakAreas.map((area) => <span key={area}>{area}</span>)}</div> : <p>No weak area has been identified yet.</p>}
      </section>

      <section className={styles.referenceGroup} style={{ marginTop: 14 }}>
        <h2>Recent practice</h2>
        {summary.recent.length ? (
          <div className={styles.recentList}>
            {summary.recent.map((event, index) => (
              <article className={styles.recentItem} key={event.eventId ?? `${event.occurredAt}:${index}`}>
                <div><strong>{kindLabels[event.kind]}</strong><span>{event.contentId.replaceAll("-", " ")}</span></div>
                <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
        ) : <div className={styles.emptyProgress}>Complete Quick Start, a system lesson, cockpit orientation, checklist, scenario or knowledge question and it will appear here.</div>}
      </section>
    </section>
  );
}
