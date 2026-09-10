"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { appendBrowserProgress } from "@/lib/browser-progress";
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

const ALL_PHASES = "all";

export function ChecklistRunner({ checklist }: Readonly<{ checklist: RuntimeChecklist }>) {
  const [mode, setMode] = useState<ChecklistTrainingMode>("run");
  const [phaseFilter, setPhaseFilter] = useState<string>(ALL_PHASES);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [revealedFlowPhases, setRevealedFlowPhases] = useState<Set<string>>(() => new Set());
  const [revealedResponses, setRevealedResponses] = useState<Set<string>>(() => new Set());
  const [recordedCompletion, setRecordedCompletion] = useState(false);

  const visiblePhases = useMemo(
    () => phaseFilter === ALL_PHASES ? checklist.phases : checklist.phases.filter((phase) => phase.id === phaseFilter),
    [checklist, phaseFilter],
  );
  const visibleItemIds = useMemo(() => new Set(visiblePhases.flatMap((phase) => phase.items.map((item) => item.id))), [visiblePhases]);
  const totalItems = visibleItemIds.size;
  const completedCount = [...completed].filter((itemId) => visibleItemIds.has(itemId)).length;
  const percent = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);
  const activeMode = checklistTrainingModes.find((candidate) => candidate.key === mode) ?? checklistTrainingModes[0];

  function resetSession() {
    setCompleted(new Set());
    setRevealedFlowPhases(new Set());
    setRevealedResponses(new Set());
    setRecordedCompletion(false);
  }

  function changeMode(nextMode: ChecklistTrainingMode) { setMode(nextMode); resetSession(); }
  function changePhase(nextPhase: string) { setPhaseFilter(nextPhase); resetSession(); }

  function toggle(itemId: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);

      const completeNow = visibleItemIds.size > 0 && [...visibleItemIds].every((id) => next.has(id));
      if (completeNow && !recordedCompletion) {
        appendBrowserProgress({
          aircraftId: checklist.aircraftId,
          kind: phaseFilter === ALL_PHASES ? "normal-flight" : "checklist-phase",
          contentId: phaseFilter === ALL_PHASES ? `complete-checklist:${mode}` : `${phaseFilter}:${mode}`,
          occurredAt: new Date().toISOString(),
          completed: true,
        });
        setRecordedCompletion(true);
      } else if (!completeNow && recordedCompletion) {
        setRecordedCompletion(false);
      }
      return next;
    });
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
    return (
      <details className={styles.explanation}>
        <summary>Procedure / explanation</summary>
        {item.condition ? <p><strong>When:</strong> {item.condition}</p> : null}
        {item.explanation ? <p>{item.explanation}</p> : null}
        {item.verification ? <p><strong>Verify:</strong> {item.verification}</p> : null}
        {item.procedureId ? <p><Link href={`/aircraft/${checklist.aircraftId}/procedures#${encodeURIComponent(item.procedureId)}`}>Open detailed procedure →</Link></p> : null}
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

  return (
    <section className={styles.runner} aria-label="Aircraft checklist">
      <div className={styles.trainingControls}>
        <div className={styles.modeHeader}>
          <div><p className="eyebrow">Checklist mode</p><strong>{activeMode.label}</strong><span>{activeMode.description}</span></div>
          <label className={styles.phaseSelect}><span>Scope</span><select value={phaseFilter} onChange={(event) => changePhase(event.target.value)}><option value={ALL_PHASES}>Complete checklist</option>{checklist.phases.map((phase) => <option value={phase.id} key={phase.id}>{phase.title}</option>)}</select></label>
        </div>
        <div className={styles.modeTabs} role="group" aria-label="Checklist mode">
          {checklistTrainingModes.map((candidate) => <button aria-pressed={candidate.key === mode} className={candidate.key === mode ? styles.modeActive : undefined} key={candidate.key} onClick={() => changeMode(candidate.key)} type="button">{candidate.label}</button>)}
        </div>
      </div>

      <header className={styles.progress}>
        <div><p className="eyebrow">Current session</p><strong>{completedCount} / {totalItems} items</strong></div>
        <div className={styles.track} aria-label={`${percent}% complete`}><span style={{ width: `${percent}%` }} /></div>
        <button className={styles.reset} type="button" onClick={resetSession}>Reset session</button>
      </header>

      <div className={styles.phases}>
        {visiblePhases.map((phase, phaseIndex) => {
          const phaseComplete = phase.items.every((item) => completed.has(item.id));
          const flowRevealed = revealedFlowPhases.has(phase.id);
          return (
            <section className={`${styles.phase} ${phaseComplete ? styles.phaseComplete : ""}`} key={phase.id}>
              <div className={styles.phaseHeading}><span>{String(phaseIndex + 1).padStart(2, "0")}</span><div><h2>{phase.title}</h2><small>{phase.items.length} items</small></div></div>
              {mode === "flow" && !flowRevealed ? (
                <div className={styles.flowPrompt}><div><strong>Perform this sequence from memory.</strong><p>When finished, reveal the checklist and verify every item.</p></div><button type="button" onClick={() => revealFlowPhase(phase.id)}>Reveal checklist</button></div>
              ) : <div className={styles.items}>{phase.items.map((item) => mode === "challenge" ? renderChallengeItem(item) : renderStandardItem(item))}</div>}
            </section>
          );
        })}
      </div>
    </section>
  );
}
