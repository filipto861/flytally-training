"use client";

import { useMemo, useState } from "react";

import type { SimulatorFlightFlow } from "@/lib/simulator-checklists";
import styles from "./checklist-runner.module.css";

export function ChecklistRunner({ flow }: Readonly<{ flow: SimulatorFlightFlow }>) {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  const totalItems = useMemo(
    () => flow.phases.reduce((sum, phase) => sum + phase.items.length, 0),
    [flow],
  );
  const completedCount = completed.size;
  const percent = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);

  function toggle(itemId: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return (
    <section className={styles.runner} aria-label="Cold and dark simulator checklist">
      <header className={styles.progress}>
        <div>
          <p className="eyebrow">Live sim flow</p>
          <strong>{completedCount} / {totalItems} items</strong>
        </div>
        <div className={styles.track} aria-label={`${percent}% complete`}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <button className={styles.reset} type="button" onClick={() => setCompleted(new Set())}>Reset flight</button>
      </header>

      <div className={styles.phases}>
        {flow.phases.map((phase, phaseIndex) => {
          const phaseComplete = phase.items.every((item) => completed.has(item.id));
          return (
            <section className={`${styles.phase} ${phaseComplete ? styles.phaseComplete : ""}`} key={phase.id}>
              <div className={styles.phaseHeading}>
                <span>{String(phaseIndex + 1).padStart(2, "0")}</span>
                <h2>{phase.title}</h2>
              </div>

              <div className={styles.items}>
                {phase.items.map((item) => {
                  const isDone = completed.has(item.id);
                  return (
                    <label className={`${styles.item} ${isDone ? styles.itemComplete : ""}`} key={item.id}>
                      <input checked={isDone} type="checkbox" onChange={() => toggle(item.id)} />
                      <span className={styles.checkmark} aria-hidden="true" />
                      <span className={styles.copy}>
                        <strong>{item.action}</strong>
                        {item.why ? <span>{item.why}</span> : null}
                        <small>Source · Ch {item.source.chapter} · {item.source.manualPage}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
