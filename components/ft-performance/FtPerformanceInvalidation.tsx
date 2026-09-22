"use client";

import type { PerformanceContextChange } from "@/lib/performance/context";

import styles from "./ft-performance.module.css";

export function FtPerformanceInvalidation({
  changes,
  busy,
  onRecalculate,
}: Readonly<{
  changes: readonly PerformanceContextChange[];
  busy: boolean;
  onRecalculate: () => void;
}>) {
  return (
    <div className={styles.invalidation} role="status" data-performance-state="recalc">
      <p className={styles.invalidationTitle}>NEEDS RECALCULATION</p>
      <p>
        Performance inputs changed. Stored values are retained only as stale
        reference until recalculated.
      </p>
      {changes.length ? (
        <ul className={styles.changeList}>
          {changes.map((change) => (
            <li key={change.key}>
              {change.label}: {change.before} → {change.after}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        className={styles.action}
        disabled={busy}
        onClick={onRecalculate}
        type="button"
      >
        {busy ? "Recalculating…" : "Recalculate"}
      </button>
    </div>
  );
}
