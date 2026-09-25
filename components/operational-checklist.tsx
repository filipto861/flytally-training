"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useOptionalFtFastPath } from "@/components/ft-fast-path/FtFastPathProvider";
import type { OperationalChecklist as OperationalChecklistData, OperationalChecklistItem } from "@/lib/operational-flight-data";
import styles from "./operational-checklist.module.css";

type StoredFlightChecklist = {
  readonly version: 1;
  readonly phaseId: string;
  readonly completedIds: readonly string[];
};

function storageKey(checklist: OperationalChecklistData, selectedVariant?: string): string {
  return `flytally:flight-checklist:v1:${checklist.aircraftId}:${selectedVariant ?? "common"}:${checklist.title}`;
}

function operationalAlerts(item: OperationalChecklistItem) {
  return item.notices ?? [];
}

export function OperationalChecklist({
  checklist,
  selectedVariant,
}: Readonly<{
  checklist: OperationalChecklistData;
  selectedVariant?: string;
}>) {
  const key = useMemo(() => storageKey(checklist, selectedVariant), [checklist, selectedVariant]);
  const [phaseId, setPhaseId] = useState(() => checklist.phases[0]?.id ?? "");
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [resetAllArmed, setResetAllArmed] = useState(false);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sharedChecklist = useOptionalFtFastPath();
  const sharedActive = Boolean(
    sharedChecklist?.checklist
    && sharedChecklist.checklist.aircraftId === checklist.aircraftId
    && sharedChecklist.checklist.title === checklist.title,
  );
  const sharedSnapshot =
    sharedActive && sharedChecklist?.checklistHydrated
      ? sharedChecklist.checklistSnapshot
      : undefined;
  const activePhaseId = sharedSnapshot?.selectedPhaseId ?? phaseId;
  const activeCompleted = sharedSnapshot
    ? new Set(sharedSnapshot.completedIds)
    : completed;

  useEffect(() => {
    if (sharedActive) {
      setHydrated(true);
      return;
    }
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
  }, [checklist, key, sharedActive]);

  useEffect(() => {
    if (!hydrated || sharedActive) return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ version: 1, phaseId, completedIds: [...completed] } satisfies StoredFlightChecklist));
    } catch {
      // Flight checklist remains usable if persistent browser storage is unavailable.
    }
  }, [completed, hydrated, key, phaseId, sharedActive]);

  if (sharedActive && !sharedChecklist?.checklistHydrated) {
    return (
      <section className={styles.checklist} role="status">
        Restoring checklist session…
      </section>
    );
  }

    const currentPhase = checklist.phases.find((phase) => phase.id === activePhaseId) ?? checklist.phases[0];
  if (!currentPhase) return null;
  const phaseIndex = checklist.phases.findIndex((phase) => phase.id === currentPhase.id);
  const completeInPhase = currentPhase.items.filter((item) => activeCompleted.has(item.id)).length;
  const totalItems = checklist.phases.reduce((sum, phase) => sum + phase.items.length, 0);
  const totalComplete = checklist.phases.reduce((sum, phase) => sum + phase.items.filter((item) => activeCompleted.has(item.id)).length, 0);
  const overallPercent = totalItems ? Math.round((totalComplete / totalItems) * 100) : 0;
  const nextUncheckedId = currentPhase.items.find((item) => !activeCompleted.has(item.id))?.id;

  function choosePhase(nextPhaseId: string) {
    setResetArmed(false);
    setResetAllArmed(false);
    if (sharedActive && sharedChecklist) {
      sharedChecklist.selectChecklistPhase(nextPhaseId);
      return;
    }
    setPhaseId(nextPhaseId);
  }

  function toggle(itemId: string) {
    setResetAllArmed(false);
    const wasDone = activeCompleted.has(itemId);
    const shouldAdvance = !wasDone && nextUncheckedId === itemId;
    const itemIndex = currentPhase.items.findIndex((item) => item.id === itemId);
    const followingUnchecked = shouldAdvance
      ? currentPhase.items.slice(itemIndex + 1).find((item) => !activeCompleted.has(item.id))
      : undefined;

    if (sharedActive && sharedChecklist) {
      sharedChecklist.toggleChecklistItem(itemId);
    } else {
      setCompleted((current) => {
        const next = new Set(current);
        if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
        return next;
      });
    }

    if (followingUnchecked) {
      window.requestAnimationFrame(() => {
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        itemRefs.current[followingUnchecked.id]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      });
    }
  }

  function resetPhase() {
    setResetAllArmed(false);
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    if (sharedActive && sharedChecklist) {
      sharedChecklist.resetChecklistPhase(currentPhase.id);
    } else {
      const ids = new Set(currentPhase.items.map((item) => item.id));
      setCompleted((current) => new Set([...current].filter((id) => !ids.has(id))));
    }
    setResetArmed(false);
    const first = currentPhase.items[0];
    if (first) window.requestAnimationFrame(() => itemRefs.current[first.id]?.scrollIntoView({ behavior: "auto", block: "center" }));
  }

  function resetAll() {
    setResetArmed(false);
    if (!resetAllArmed) {
      setResetAllArmed(true);
      return;
    }
    const firstPhase = checklist.phases[0];
    if (sharedActive && sharedChecklist) {
      sharedChecklist.resetChecklistAll();
    } else {
      setCompleted(new Set());
      setPhaseId(firstPhase?.id ?? "");
    }
    setResetAllArmed(false);
    const firstItem = firstPhase?.items[0];
    if (firstItem) window.requestAnimationFrame(() => itemRefs.current[firstItem.id]?.scrollIntoView({ behavior: "auto", block: "center" }));
  }

  const previous = checklist.phases[phaseIndex - 1];
  const next = checklist.phases[phaseIndex + 1];

  return (
    <section className={styles.checklist} aria-label={checklist.title}>
      <div className={styles.overallProgress} aria-label="Overall checklist progress">
        <div className={styles.overallHeader}>
          <strong>Checklist</strong>
          <div className={styles.overallActions}>
            <span>{totalComplete}/{totalItems}</span>
            <button
              aria-label={resetAllArmed ? "Confirm reset of entire checklist" : "Reset entire checklist"}
              className={resetAllArmed ? styles.resetAllArmed : undefined}
              disabled={totalComplete === 0}
              onBlur={() => setResetAllArmed(false)}
              onClick={resetAll}
              type="button"
            >{resetAllArmed ? "Confirm all" : "Reset all"}</button>
          </div>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={totalItems} aria-valuenow={totalComplete}>
          <span style={{ width: `${overallPercent}%` }} />
        </div>
      </div>

      <div className={styles.phaseBar}>
        <label className={styles.phasePicker}>
          <span>Phase {phaseIndex + 1} of {checklist.phases.length}</span>
          <select aria-label="Checklist phase" onChange={(event) => choosePhase(event.target.value)} value={currentPhase.id}>
            {checklist.phases.map((phase) => {
              const phaseDone = phase.items.length > 0 && phase.items.every((item) => activeCompleted.has(item.id));
              return <option key={phase.id} value={phase.id}>{phaseDone ? "✓ " : ""}{phase.title}</option>;
            })}
          </select>
        </label>
        <div className={styles.phaseActions}>
          <span aria-label={`${completeInPhase} of ${currentPhase.items.length} items complete`}>{completeInPhase}/{currentPhase.items.length}</span>
          <button
            aria-label={resetArmed ? `Confirm reset of ${currentPhase.title}` : `Reset ${currentPhase.title}`}
            className={resetArmed ? styles.resetArmed : undefined}
            onBlur={() => setResetArmed(false)}
            onClick={resetPhase}
            type="button"
          >{resetArmed ? "Confirm" : "Reset"}</button>
        </div>
      </div>

      <div className={styles.items}>
        {currentPhase.items.map((item) => {
          const done = activeCompleted.has(item.id);
          const isNext = !done && item.id === nextUncheckedId;
          const alerts = operationalAlerts(item);
          return <div className={`${styles.itemWrap} ${done ? styles.done : ""} ${isNext ? styles.nextItem : ""}`} key={item.id}>
            <button
              aria-pressed={done}
              className={styles.item}
              onClick={() => toggle(item.id)}
              ref={(node) => { itemRefs.current[item.id] = node; }}
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
        {previous ? <button onClick={() => choosePhase(previous.id)} type="button">← {previous.title}</button> : <span />}
        {next ? <button className={styles.next} onClick={() => choosePhase(next.id)} type="button">{next.title} →</button> : <strong>{completeInPhase === currentPhase.items.length ? "Complete ✓" : "Final phase"}</strong>}
      </footer>
    </section>
  );
}
