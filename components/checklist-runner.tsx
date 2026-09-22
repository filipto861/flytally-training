"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import { appendBrowserProgress } from "@/lib/browser-progress";
import {
  checklistPhaseProgress,
  checklistProgressContentId,
  checklistSessionStorageKey,
  initialChecklistPhaseId,
  nextChecklistPhaseId,
} from "@/lib/checklist-session";
import { restoreChecklistSessionWithLegacyMigration } from "@/lib/checklist-session-migration";
import {
  checklistTrainingModes,
  type ChecklistTrainingMode,
} from "@/lib/checklist-training";
import {
  formatChecklistAction,
  type RuntimeChecklist,
  type RuntimeChecklistItem,
} from "@/lib/checklist-runtime";
import styles from "./checklist-runner.module.css";

export function ChecklistRunner({
  checklist,
  selectedVariant,
}: Readonly<{
  checklist: RuntimeChecklist;
  selectedVariant?: string;
}>) {
  const [mode, setMode] = useState<ChecklistTrainingMode>("run");
  const [selectedPhaseId, setSelectedPhaseId] = useState(() => initialChecklistPhaseId(checklist));
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [revealedFlowPhases, setRevealedFlowPhases] = useState<Set<string>>(() => new Set());
  const [revealedResponses, setRevealedResponses] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  const storageKey = useMemo(
    () => checklistSessionStorageKey(checklist, selectedVariant),
    [checklist, selectedVariant],
  );
  const phaseProgress = useMemo(() => checklistPhaseProgress(checklist, completed), [checklist, completed]);
  const currentPhase = checklist.phases.find((phase) => phase.id === selectedPhaseId) ?? checklist.phases[0];
  const currentPhaseProgress = phaseProgress.find((phase) => phase.phaseId === currentPhase?.id);
  const totalItems = checklist.phases.reduce((total, phase) => total + phase.items.length, 0);
  const completedCount = phaseProgress.reduce((total, phase) => total + phase.completedItems, 0);
  const percent = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);
  const activeMode = checklistTrainingModes.find((candidate) => candidate.key === mode) ?? checklistTrainingModes[0];
  const nextPhaseId = currentPhase ? nextChecklistPhaseId(checklist, currentPhase.id) : undefined;
  const nextPhase = nextPhaseId ? checklist.phases.find((phase) => phase.id === nextPhaseId) : undefined;

  useEffect(() => {
    const snapshot = restoreChecklistSessionWithLegacyMigration(
      checklist,
      window.sessionStorage,
      window.localStorage,
      selectedVariant,
    );
    setMode(snapshot.mode);
    setSelectedPhaseId(snapshot.selectedPhaseId);
    setCompleted(new Set(snapshot.completedIds));
    setRevealedFlowPhases(new Set(snapshot.revealedFlowPhaseIds));
    setRevealedResponses(new Set(snapshot.revealedResponseIds));
    setHydrated(true);
  }, [checklist, selectedVariant, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        version: 1,
        mode,
        selectedPhaseId,
        completedIds: [...completed],
        revealedFlowPhaseIds: [...revealedFlowPhases],
        revealedResponseIds: [...revealedResponses],
      }));
    } catch {
      // The checklist remains fully usable when sessionStorage is unavailable.
    }
  }, [completed, hydrated, mode, revealedFlowPhases, revealedResponses, selectedPhaseId, storageKey]);

  function recordCompletion(kind: "checklist-phase" | "normal-flight", phaseId?: string) {
    appendBrowserProgress({
      aircraftId: checklist.aircraftId,
      kind,
      contentId: checklistProgressContentId(
        kind === "normal-flight" ? "complete" : "phase",
        phaseId,
        mode,
        selectedVariant,
      ),
      occurredAt: new Date().toISOString(),
      completed: true,
    });
  }

  function toggle(itemId: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);

      const affectedPhase = checklist.phases.find((phase) => phase.items.some((item) => item.id === itemId));
      if (affectedPhase) {
        const wasComplete = affectedPhase.items.length > 0 && affectedPhase.items.every((item) => current.has(item.id));
        const isComplete = affectedPhase.items.length > 0 && affectedPhase.items.every((item) => next.has(item.id));
        if (!wasComplete && isComplete) recordCompletion("checklist-phase", affectedPhase.id);
      }

      const wasAllComplete = totalItems > 0 && checklist.phases.every((phase) => phase.items.every((item) => current.has(item.id)));
      const isAllComplete = totalItems > 0 && checklist.phases.every((phase) => phase.items.every((item) => next.has(item.id)));
      if (!wasAllComplete && isAllComplete) recordCompletion("normal-flight");
      return next;
    });
  }

  function resetCurrentPhase() {
    if (!currentPhase) return;
    const itemIds = new Set(currentPhase.items.map((item) => item.id));
    setCompleted((current) => new Set([...current].filter((itemId) => !itemIds.has(itemId))));
    setRevealedResponses((current) => new Set([...current].filter((itemId) => !itemIds.has(itemId))));
    setRevealedFlowPhases((current) => new Set([...current].filter((phaseId) => phaseId !== currentPhase.id)));
  }

  function revealFlowPhase(phaseId: string) { setRevealedFlowPhases((current) => new Set(current).add(phaseId)); }
  function revealResponse(itemId: string) { setRevealedResponses((current) => new Set(current).add(itemId)); }

  function renderOperationalNotices(item: RuntimeChecklistItem) {
    const notices = item.notices?.filter((notice) => notice.kind !== "note" || mode === "learn") ?? [];
    if (!notices.length) return null;
    return (
      <div className={styles.notices}>
        {notices.map((notice, index) => (
          <p className={styles[notice.kind]} key={`${item.id}-${notice.kind}-${index}`}>
            <strong>{notice.kind.toUpperCase()}:</strong> {notice.text}
          </p>
        ))}
      </div>
    );
  }

  function renderDetails(item: RuntimeChecklistItem) {
    if (mode !== "learn" || (!item.explanation && !item.verification && !item.condition && !item.procedureId && !item.sourceLabel)) return null;
    const procedureHref = item.procedureId
      ? `${withVariantQuery(`/aircraft/${checklist.aircraftId}/procedures`, selectedVariant)}#${encodeURIComponent(item.procedureId)}`
      : undefined;
    return (
      <details className={styles.explanation}>
        <summary>Procedure / explanation</summary>
        {item.condition ? <p><strong>When:</strong> {item.condition}</p> : null}
        {item.explanation ? <p>{item.explanation}</p> : null}
        {item.verification ? <p><strong>Verify:</strong> {item.verification}</p> : null}
        {procedureHref ? <p><Link href={procedureHref}>Open detailed procedure →</Link></p> : null}
        {item.sourceLabel ? <small>Source · {item.sourceLabel}</small> : null}
      </details>
    );
  }

  function renderStandardItem(item: RuntimeChecklistItem) {
    const isDone = completed.has(item.id);
    const action = formatChecklistAction(item);
    return (
      <div className={`${styles.item} ${isDone ? styles.itemComplete : ""}`} key={item.id}>
        <button aria-label={`${isDone ? "Uncheck" : "Complete"} ${action}`} aria-pressed={isDone} className={styles.checkButton} onClick={() => toggle(item.id)} type="button"><span className={styles.checkmark} aria-hidden="true" /></button>
        <div className={styles.copy}>
          <strong>{action}</strong>
          {renderOperationalNotices(item)}
          {renderDetails(item)}
        </div>
      </div>
    );
  }

  function renderChallengeItem(item: RuntimeChecklistItem) {
    const isDone = completed.has(item.id);
    const revealed = revealedResponses.has(item.id);
    return (
      <article className={`${styles.item} ${styles.challengeItem} ${isDone ? styles.itemComplete : ""}`} key={item.id}>
        <div className={styles.challengeCopy}>
          <small>Challenge</small><strong>{item.challenge}</strong>
          {revealed ? <div className={styles.response}><small>Response</small><span>{item.response ?? "Confirm action"}</span></div> : null}
          {revealed ? renderOperationalNotices(item) : null}
        </div>
        <div className={styles.challengeActions}>
          {!revealed ? <button type="button" onClick={() => revealResponse(item.id)}>Reveal response</button> : <button aria-pressed={isDone} type="button" onClick={() => toggle(item.id)}>{isDone ? "Completed ✓" : "Confirm"}</button>}
        </div>
      </article>
    );
  }

  if (!currentPhase) return null;
  const phaseIndex = checklist.phases.findIndex((phase) => phase.id === currentPhase.id);
  const flowRevealed = revealedFlowPhases.has(currentPhase.id);

  return (
    <section className={styles.runner} aria-label="Aircraft checklist">
      <div className={styles.trainingControls}>
        <div className={styles.modeHeader}>
          <div><p className="eyebrow">Checklist mode</p><strong>{activeMode.label}</strong><span>{activeMode.description}</span></div>
          <span className={styles.resumeState}>{hydrated ? "Session progress saved in this tab" : "Restoring session…"}</span>
        </div>
        <div className={styles.modeTabs} role="group" aria-label="Checklist mode">
          {checklistTrainingModes.map((candidate) => <button aria-pressed={candidate.key === mode} className={candidate.key === mode ? styles.modeActive : undefined} key={candidate.key} onClick={() => setMode(candidate.key)} type="button">{candidate.label}</button>)}
        </div>
      </div>

      <nav className={styles.phaseNavigator} aria-label="Checklist phases">
        {checklist.phases.map((phase, index) => {
          const progress = phaseProgress.find((candidate) => candidate.phaseId === phase.id);
          const active = phase.id === currentPhase.id;
          return <button aria-current={active ? "step" : undefined} className={`${styles.phaseNavButton} ${active ? styles.phaseNavActive : ""} ${progress?.complete ? styles.phaseNavComplete : ""}`} key={phase.id} onClick={() => setSelectedPhaseId(phase.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><strong>{phase.title}</strong><small>{progress?.completedItems ?? 0}/{progress?.totalItems ?? phase.items.length}</small></button>;
        })}
      </nav>

      <header className={styles.progress}>
        <div><p className="eyebrow">Checklist progress</p><strong>{completedCount} / {totalItems} items</strong></div>
        <div className={styles.track} aria-label={`${percent}% complete`}><span style={{ width: `${percent}%` }} /></div>
        <button className={styles.reset} type="button" onClick={resetCurrentPhase}>Reset this phase</button>
      </header>

      <section className={`${styles.phase} ${currentPhaseProgress?.complete ? styles.phaseComplete : ""}`}>
        <div className={styles.phaseHeading}>
          <span>{String(phaseIndex + 1).padStart(2, "0")}</span>
          <div><h2>{currentPhase.title}</h2><small>{currentPhaseProgress?.completedItems ?? 0} of {currentPhase.items.length} items complete</small></div>
        </div>
        {mode === "flow" && !flowRevealed ? (
          <div className={styles.flowPrompt}><div><strong>Perform this sequence from memory.</strong><p>When finished, reveal the checklist and verify every item.</p></div><button type="button" onClick={() => revealFlowPhase(currentPhase.id)}>Reveal checklist</button></div>
        ) : <div className={styles.items}>{currentPhase.items.map((item) => mode === "challenge" ? renderChallengeItem(item) : renderStandardItem(item))}</div>}
      </section>

      <footer className={styles.phaseFooter}>
        <div><strong>{currentPhaseProgress?.complete ? "Phase complete" : "Current phase"}</strong><span>{currentPhase.title}</span></div>
        {nextPhase ? <button type="button" onClick={() => setSelectedPhaseId(nextPhase.id)}>Next phase · {nextPhase.title} →</button> : <span className={styles.finalPhase}>{percent === 100 ? "Checklist complete ✓" : "Final phase"}</span>}
      </footer>
    </section>
  );
}
