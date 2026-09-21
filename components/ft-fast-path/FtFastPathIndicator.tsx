"use client";

import { useFtFastPath } from "./FtFastPathProvider";
import styles from "./ft-fast-path.module.css";

export function FtFastPathIndicator() {
  const { checklistProgress, openPanel } = useFtFastPath();

  if (!checklistProgress.active) return null;

  return (
    <button
      type="button"
      className={styles.indicator}
      aria-label={`Open checklist progress ${checklistProgress.completed} of ${checklistProgress.total}`}
      onClick={() => openPanel("checklist")}
    >
      Checklist {checklistProgress.completed}/{checklistProgress.total}
    </button>
  );
}
