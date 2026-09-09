"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  checklistTrainingModes,
  splitChecklistChallenge,
  type ChecklistTrainingMode,
} from "@/lib/checklist-training";
import { getCockpitLocationForChecklistItem } from "@/lib/cockpit-orientation";
import type { SimulatorFlightFlow, SimulatorChecklistItem } from "@/lib/simulator-checklists";
import styles from "./checklist-runner.module.css";

const ALL_PHASES = "all";

export function ChecklistRunner({ flow }: Readonly<{ flow: SimulatorFlightFlow }>) {
  const [mode, setMode] = useState<ChecklistTrainingMode>("learn");
  const [phaseFilter, setPhaseFilter] = useState<string>(ALL_PHASES);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [revealedFlowPhases, setRevealedFlowPhases] = useState<Set<string>>(() => new Set());
  const [revealedResponses, setRevealedResponses] = useState<Set<string>>(() => new Set());

  const visiblePhases = useMemo(
    () => phaseFilter === ALL_PHASES ? flow.phases : flow.phases.filter((phase) => phase.id === phaseFilter),
    [flow, phaseFilter],
  );

  const visibleItemIds = useMemo(
    () => new Set(visiblePhases.flatMap((phase) => phase.items.map((item) => item.id))),
    [visiblePhases],
  );

  const totalItems = visibleItemIds.size;
  const completedCount = [...completed].filter((itemId) => visibleItemIds.has(itemId)).length;
  const percent = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);
  const activeMode = checklistTrainingModes.find((candidate) => candidate.key === mode) ?? checklistTrainingModes[0];

  function resetSession() {
    setCompleted(new Set());
    setRevealedFlowPhases(new Set());
    setRevealedResponses(new Set());
  }

  function changeMode(nextMode: ChecklistTrainingMode) {
    setMode(nextMode);
    resetSession();
  }

  function changePhase(nextPhase: string) {
    setPhaseFilter(nextPhase);
    resetSession();
  }

  function toggle(itemId: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function revealFlowPhase(phaseId: string) {
    setRevealedFlowPhases((current) => new Set(current).add(phaseId));
  }

  function revealResponse(itemId: string) {
    setRevealedResponses((current) => new Set(current).add(itemId));
  }

  function showMeLink(item: SimulatorChecklistItem) {
    const location = getCockpitLocationForChecklistItem(flow.aircraftId, item.id);
    if (!location) return null;

    return (
      <Link
        className={styles.showMe}
        href={`/aircraft/${flow.aircraftId}/orientation?item=${encodeURIComponent(item.id)}`}
      >
        Show me · {location.regionId.replaceAll("-", " ")} →
      </Link>
    );
  }

  function renderStandardItem(item: SimulatorChecklistItem) {
    const isDone = completed.has(item.id);
    const showExplanation = mode === "learn";

    return (
      <div className={`${styles.item} ${isDone ? styles.itemComplete : ""}`} key={item.id}>
        <button
          aria-label={`${isDone ? "Uncheck" : "Complete"} ${item.action}`}
          aria-pressed={isDone}
          className={styles.checkButton}
          onClick={() => toggle(item.id)}
          type="button"
        >
          <span className={styles.checkmark} aria-hidden="true" />
        </button>
        <div className={styles.copy}>
          <strong>{item.action}</strong>
          {showMeLink(item)}
          {showExplanation && item.why ? (
            <details className={styles.explanation}>
              <summary>Why?</summary>
              <p>{item.why}</p>
              <small>Source · Ch {item.source.chapter} · {item.source.manualPage}</small>
            </details>
          ) : null}
        </div>
      </div>
    );
  }

  function renderChallengeItem(item: SimulatorChecklistItem) {
    const isDone = completed.has(item.id);
    const revealed = revealedResponses.has(item.id);
    const challenge = splitChecklistChallenge(item.action);

    return (
      <article className={`${styles.item} ${styles.challengeItem} ${isDone ? styles.itemComplete : ""}`} key={item.id}>
        <div className={styles.challengeCopy}>
          <small>Challenge</small>
          <strong>{challenge.challenge}</strong>
          {showMeLink(item)}
          {revealed ? (
            <div className={styles.response}>
              <small>Response</small>
              <span>{challenge.response ?? "Confirm action"}</span>
            </div>
          ) : null}
        </div>
        <div className={styles.challengeActions}>
          {!revealed ? (
            <button type="button" onClick={() => revealResponse(item.id)}>Reveal response</button>
          ) : (
            <button aria-pressed={isDone} type="button" onClick={() => toggle(item.id)}>
              {isDone ? "Completed ✓" : "Confirm"}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <section className={styles.runner} aria-label="Cold and dark simulator checklist trainer">
      <div className={styles.trainingControls}>
        <div className={styles.modeHeader}>
          <div>
            <p className="eyebrow">Training mode</p>
            <strong>{activeMode.label}</strong>
            <span>{activeMode.description}</span>
          </div>
          <label className={styles.phaseSelect}>
            <span>Practice</span>
            <select value={phaseFilter} onChange={(event) => changePhase(event.target.value)}>
              <option value={ALL_PHASES}>Complete flight</option>
              {flow.phases.map((phase) => <option value={phase.id} key={phase.id}>{phase.title}</option>)}
            </select>
          </label>
        </div>

        <div className={styles.modeTabs} role="group" aria-label="Checklist training mode">
          {checklistTrainingModes.map((candidate) => (
            <button
              aria-pressed={candidate.key === mode}
              className={candidate.key === mode ? styles.modeActive : undefined}
              key={candidate.key}
              onClick={() => changeMode(candidate.key)}
              type="button"
            >
              {candidate.label}
            </button>
          ))}
        </div>
      </div>

      <header className={styles.progress}>
        <div>
          <p className="eyebrow">Current session</p>
          <strong>{completedCount} / {totalItems} items</strong>
        </div>
        <div className={styles.track} aria-label={`${percent}% complete`}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <button className={styles.reset} type="button" onClick={resetSession}>Reset session</button>
      </header>

      <div className={styles.phases}>
        {visiblePhases.map((phase, phaseIndex) => {
          const phaseComplete = phase.items.every((item) => completed.has(item.id));
          const flowRevealed = revealedFlowPhases.has(phase.id);

          return (
            <section className={`${styles.phase} ${phaseComplete ? styles.phaseComplete : ""}`} key={phase.id}>
              <div className={styles.phaseHeading}>
                <span>{String(phaseIndex + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{phase.title}</h2>
                  <small>{phase.items.length} items</small>
                </div>
              </div>

              {mode === "flow" && !flowRevealed ? (
                <div className={styles.flowPrompt}>
                  <div>
                    <strong>Perform this flow from memory in the simulator.</strong>
                    <p>When you are finished, reveal the checklist and verify every item.</p>
                  </div>
                  <button type="button" onClick={() => revealFlowPhase(phase.id)}>Reveal checklist</button>
                </div>
              ) : (
                <div className={styles.items}>
                  {phase.items.map((item) => mode === "challenge" ? renderChallengeItem(item) : renderStandardItem(item))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
