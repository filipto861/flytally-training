"use client";

import { useEffect, useMemo, useState } from "react";

import type { RuntimeChecklist, RuntimeChecklistItem } from "@/lib/checklist-runtime";
import styles from "./operational-checklist.module.css";

type StoredFlightChecklist = {
  readonly version: 1;
  readonly phaseId: string;
  readonly completedIds: readonly string[];
};

function storageKey(checklist: RuntimeChecklist, selectedVariant?: string): string {
  return `flytally:flight-checklist:v1:${checklist.aircraftId}:${selectedVariant ?? "common"}:${checklist.title}`;
}

function operationalAlerts(item: RuntimeChecklistItem) {
  return item.notices?.filter((notice) => notice.kind === "warning" || notice.kind === "caution") ?? [];
}

export function OperationalChecklist({
  checklist,
  selectedVariant,
}: Readonly<{
  checklist: RuntimeChecklist;
  selectedVariant?: string;
}>) {
  const key = useMemo(() => storageKey(checklist, selectedVariant), [checklist, selectedVariant]);
  const [phaseId, setPhaseId] = useState(() => checklist.phases[0]?.id ?? "");
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored: StoredFlightChecklist | undefined;
    try {
      const raw = window.localStorage.getItem(key);
      stored = raw ? JSON.parse(raw) as StoredFlightChecklist : undefined;
    } catch {
      stored = undefined;
    }
    const validItemIds = new Set(checklist.phases.flatMap((phase) => phase.items.map((item) => item.id)));
    const validPhase = stored && checklist.phases.some((phase) => phase.id === stored.phaseId)
      ? stored.phaseId
      : checklist.phases[0]?.id ?? "";
    setPhaseId(validPhase);
    setCompleted(new Set((stored?.completedIds ?? []).filter((id) => validItemIds.has(id))));
    setHydrated(true);
  }, [checklist, key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ version: 1, phaseId, completedIds: [...completed] } satisfies StoredFlightChecklist));
    } catch {
      // Flight checklist remains usable if persistent browser storage is unavailable.
    }
  }, [completed, hydrated, key, phaseId]);

  const currentPhase = checklist.phases.find((phase) => phase.id === phaseId) ?? checklist.phases[0];
  if (!currentPhase) return null;
  const phaseIndex = checklist.phases.findIndex((phase) => phase.id === currentPhase.id);
  const completeInPhase = currentPhase.items.filter((item) => completed.has(item.id)).length;

  function toggle(itemId: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  function resetPhase() {
    const ids = new Set(currentPhase.items.map((item) => item.id));
    setCompleted((current) => new Set([...current].filter((id) => !ids.has(id))));
  }

  const previous = checklist.phases[phaseIndex - 1];
  const next = checklist.phases[phaseIndex + 1];

  return (
    <section className={styles.checklist} aria-label={checklist.title}>
      <nav className={styles.phases} aria-label="Checklist phases">
        {checklist.phases.map((phase) => {
          const phaseDone = phase.items.length > 0 && phase.items.every((item) => completed.has(item.id));
          return <button
            aria-current={phase.id === currentPhase.id ? "step" : undefined}
            className={`${phase.id === currentPhase.id ? styles.activePhase : ""} ${phaseDone ? styles.completePhase : ""}`}
            key={phase.id}
            onClick={() => setPhaseId(phase.id)}
            type="button"
          >{phase.title}</button>;
        })}
      </nav>

      <header className={styles.phaseHeader}>
        <div><h1>{currentPhase.title}</h1><span>{completeInPhase}/{currentPhase.items.length}</span></div>
        <button onClick={resetPhase} type="button">Reset</button>
      </header>

      <div className={styles.items}>
        {currentPhase.items.map((item) => {
          const done = completed.has(item.id);
          const alerts = operationalAlerts(item);
          return <div className={`${styles.itemWrap} ${done ? styles.done : ""}`} key={item.id}>
            <button
              aria-pressed={done}
              className={styles.item}
              onClick={() => toggle(item.id)}
              type="button"
            >
              <span className={styles.check} aria-hidden="true">{done ? "✓" : ""}</span>
              <span className={styles.challenge}>{item.challenge}</span>
              {item.response ? <strong className={styles.response}>{item.response}</strong> : null}
            </button>
            {alerts.length ? <div className={styles.alerts}>
              {alerts.map((alert, index) => <div className={alert.kind === "warning" ? styles.warning : styles.caution} key={`${item.id}-${alert.kind}-${index}`}>
                <strong>{alert.kind.toUpperCase()}</strong><span>{alert.text}</span>
              </div>)}
            </div> : null}
          </div>;
        })}
      </div>

      <footer className={styles.footer}>
        {previous ? <button onClick={() => setPhaseId(previous.id)} type="button">← {previous.title}</button> : <span />}
        {next ? <button className={styles.next} onClick={() => setPhaseId(next.id)} type="button">{next.title} →</button> : <strong>{completeInPhase === currentPhase.items.length ? "Complete ✓" : "Final phase"}</strong>}
      </footer>
    </section>
  );
}
