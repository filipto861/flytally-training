"use client";

import { useMemo } from "react";

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
  } = useFtFastPath();

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
  const flatItems = checklist.phases.flatMap((phase) => phase.items);
  const nextItem = flatItems.find((item) => !completed.has(item.id));
  const nextIndex = nextItem
    ? flatItems.findIndex((item) => item.id === nextItem.id) + 1
    : flatItems.length;

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
            ? `${nextIndex}/${flatItems.length} · ${nextItem.challenge}${
                nextItem.response ? ` — ${nextItem.response}` : ""
              }`
            : "Checklist complete"}
        </strong>
      </div>

      <label className={styles.phasePicker}>
        <span>Phase</span>
        <select
          aria-label="Fast path checklist phase"
          value={currentPhase.id}
          onChange={(event) => selectChecklistPhase(event.currentTarget.value)}
        >
          {checklist.phases.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phase.title}
            </option>
          ))}
        </select>
      </label>

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
    </section>
  );
}
