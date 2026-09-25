"use client";

import { useMemo, useState } from "react";

import { useFtFastPath } from "./FtFastPathProvider";
import styles from "./ft-fast-path.module.css";

export function FtFastPathChecklist() {
  const {
    checklist,
    checklistSnapshot,
    checklistHydrated,
    checklistProgress,
    toggleChecklistItem,
    selectChecklistPhase,
    resetChecklistPhase,
    resetChecklistAll,
  } = useFtFastPath();
  const [resetPhaseArmed, setResetPhaseArmed] = useState(false);
  const [resetAllArmed, setResetAllArmed] = useState(false);

  const currentPhase = useMemo(() => {
    if (!checklist || !checklistSnapshot) return undefined;
    return (
      checklist.phases.find(
        (phase) => phase.id === checklistSnapshot.selectedPhaseId,
      ) ?? checklist.phases[0]
    );
  }, [checklist, checklistSnapshot]);

  if (!checklist) {
    return (
      <section className={styles.checklistUnavailable}>
        <strong>Checklist unavailable</strong>
        <p>No governed checklist is published for this aircraft.</p>
      </section>
    );
  }

  if (!checklistHydrated || !checklistSnapshot || !currentPhase) {
    return (
      <section className={styles.checklistUnavailable} role="status">
        Restoring checklist session…
      </section>
    );
  }

  const completed = new Set(checklistSnapshot.completedIds);
  const currentPhaseCompleted = currentPhase.items.filter((item) =>
    completed.has(item.id),
  ).length;
  const currentPhaseComplete =
    currentPhase.items.length > 0
    && currentPhaseCompleted === currentPhase.items.length;
  const nextItem = currentPhase.items.find((item) => !completed.has(item.id));
  const nextIndex = nextItem
    ? currentPhase.items.findIndex((item) => item.id === nextItem.id) + 1
    : currentPhase.items.length;
  const currentPhaseId = currentPhase.id;
  const currentPhaseIndex = checklist.phases.findIndex(
    (phase) => phase.id === currentPhaseId,
  );
  const nextPhase = checklist.phases[currentPhaseIndex + 1];

  function resetPhase() {
    setResetAllArmed(false);
    if (!resetPhaseArmed) {
      setResetPhaseArmed(true);
      return;
    }
    resetChecklistPhase(currentPhaseId);
    setResetPhaseArmed(false);
  }

  function resetAll() {
    setResetPhaseArmed(false);
    if (!resetAllArmed) {
      setResetAllArmed(true);
      return;
    }
    resetChecklistAll();
    setResetAllArmed(false);
  }

  return (
    <section className={styles.checklist} aria-label="Fast path checklist">
      <header className={styles.checklistHeader}>
        <div>
          <p className={styles.eyebrow}>CHECKLIST</p>
          <h2>{checklist.title}</h2>
        </div>
        <strong className={styles.progressValue}>
          {checklistProgress.completed}/{checklistProgress.total}
        </strong>
      </header>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Checklist progress"
        aria-valuemin={0}
        aria-valuemax={checklistProgress.total}
        aria-valuenow={checklistProgress.completed}
      >
        <span
          style={{
            width: checklistProgress.total
              ? `${Math.round(
                  (checklistProgress.completed / checklistProgress.total) * 100,
                )}%`
              : "0%",
          }}
        />
      </div>

      <div className={styles.currentStep}>
        <span>CURRENT STEP</span>
        <strong>
          {nextItem
            ? `${nextIndex}/${currentPhase.items.length} · ${nextItem.challenge}${
                nextItem.response ? ` — ${nextItem.response}` : ""
              }`
            : `${currentPhase.title} complete`}
        </strong>
      </div>

      <label className={styles.phasePicker}>
        <span>Phase</span>
        <select
          aria-label="Fast path checklist phase"
          value={currentPhase.id}
          onChange={(event) => {
            setResetPhaseArmed(false);
            setResetAllArmed(false);
            selectChecklistPhase(event.currentTarget.value);
          }}
        >
          {checklist.phases.map((phase) => {
            const phaseComplete =
              phase.items.length > 0
              && phase.items.every((item) => completed.has(item.id));
            return (
              <option key={phase.id} value={phase.id}>
                {phaseComplete ? "✓ " : ""}{phase.title}
              </option>
            );
          })}
        </select>
      </label>

      <div className={styles.checklistActions}>
        <span>{currentPhaseCompleted}/{currentPhase.items.length}</span>
        <button
          type="button"
          disabled={currentPhaseCompleted === 0}
          onBlur={() => setResetPhaseArmed(false)}
          onClick={resetPhase}
        >
          {resetPhaseArmed ? "Confirm phase" : "Reset phase"}
        </button>
        <button
          type="button"
          disabled={checklistProgress.completed === 0}
          onBlur={() => setResetAllArmed(false)}
          onClick={resetAll}
        >
          {resetAllArmed ? "Confirm all" : "Reset all"}
        </button>
      </div>

      <div className={styles.checklistItems}>
        {currentPhase.items.map((item) => {
          const done = completed.has(item.id);
          return (
            <label
              key={item.id}
              className={styles.checklistItem}
              data-complete={done ? "true" : "false"}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleChecklistItem(item.id)}
              />
              <span className={styles.checklistItemCopy}>
                <strong>{item.challenge}</strong>
                {item.response ? <span>{item.response}</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      {currentPhaseComplete && nextPhase ? (
        <button
          type="button"
          className={styles.nextPhaseButton}
          onClick={() => selectChecklistPhase(nextPhase.id)}
        >
          Next phase · {nextPhase.title} →
        </button>
      ) : null}
    </section>
  );
}
