"use client";

import { useEffect, useState } from "react";

import { appendBrowserProgress, loadTrainingProgress, readBrowserProgress } from "@/lib/browser-progress";
import type { TrainingActivityKind } from "@/lib/progress-events";
import styles from "./learning-completion-button.module.css";

type CompletionKind = Extract<TrainingActivityKind, "quick-start" | "systems">;

const initialLoads = new Map<string, Promise<Awaited<ReturnType<typeof loadTrainingProgress>>>>();

function loadOnce(aircraftId: string) {
  let pending = initialLoads.get(aircraftId);
  if (!pending) {
    pending = loadTrainingProgress(aircraftId).catch((error) => {
      initialLoads.delete(aircraftId);
      throw error;
    });
    initialLoads.set(aircraftId, pending);
  }
  return pending;
}

function hasCompletion(aircraftId: string, kind: CompletionKind, contentId: string) {
  return readBrowserProgress(aircraftId).some((event) => event.kind === kind && event.contentId === contentId && event.completed);
}

export function LearningCompletionButton({
  aircraftId,
  kind,
  contentId,
  label,
}: Readonly<{
  aircraftId: string;
  kind: CompletionKind;
  contentId: string;
  label: string;
}>) {
  const [completed, setCompleted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) setCompleted(hasCompletion(aircraftId, kind, contentId));
    };

    refresh();
    void loadOnce(aircraftId).then(() => {
      refresh();
      if (active) setChecking(false);
    }).catch(() => {
      refresh();
      if (active) setChecking(false);
    });

    const onProgress = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : undefined;
      if (detail === aircraftId) refresh();
    };
    window.addEventListener("flytally-training-progress", onProgress);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.removeEventListener("flytally-training-progress", onProgress);
      window.removeEventListener("storage", refresh);
    };
  }, [aircraftId, kind, contentId]);

  const markComplete = () => {
    if (completed) return;
    appendBrowserProgress({
      aircraftId,
      kind,
      contentId,
      occurredAt: new Date().toISOString(),
      completed: true,
    });
    setCompleted(true);
  };

  return <div className={styles.completionRow}>
    <p>{completed ? "Recorded in your aircraft progress." : "When you have reviewed this material, record it as completed."}</p>
    <button className={styles.button} type="button" onClick={markComplete} disabled={completed || checking}>
      {completed ? "Completed ✓" : checking ? "Checking progress…" : label}
    </button>
  </div>;
}
