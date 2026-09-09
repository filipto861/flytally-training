"use client";

import { useState } from "react";

import type {
  AbnormalScenario,
  AircraftAbnormalTraining,
  ScenarioSourceReference,
  ScenarioStageId,
} from "@/lib/abnormal-scenarios";
import { appendBrowserProgress } from "@/lib/browser-progress";
import styles from "./scenario-trainer.module.css";

const stageLabels: Record<ScenarioStageId, string> = {
  recognition: "Recognize",
  control: "Fly the aircraft",
  immediate: "Immediate action",
  continue: "Continue",
};

function sourceLabel(reference: ScenarioSourceReference): string {
  return `Ch ${reference.chapter} · ${reference.section} · p. ${reference.manualPage}`;
}

export function ScenarioTrainer({ training }: Readonly<{ training: AircraftAbnormalTraining }>) {
  const [selectedId, setSelectedId] = useState(training.scenarios[0]?.id ?? "");
  const [stageIndex, setStageIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [repeatIds, setRepeatIds] = useState<string[]>([]);

  const scenario = training.scenarios.find((item) => item.id === selectedId) ?? training.scenarios[0];
  if (!scenario) return null;

  const stage = scenario.stages[stageIndex];
  const completed = completedIds.includes(scenario.id);
  const queuedForRepeat = repeatIds.includes(scenario.id);

  function openScenario(nextScenario: AbnormalScenario) {
    setSelectedId(nextScenario.id);
    setStageIndex(0);
    setRevealed(false);
    setFinished(false);
  }

  function finishScenario() {
    if (!completedIds.includes(scenario.id)) {
      appendBrowserProgress({
        aircraftId: training.aircraftId,
        kind: "scenario",
        contentId: scenario.id,
        occurredAt: new Date().toISOString(),
        completed: true,
      });
    }
    setCompletedIds((current) => current.includes(scenario.id) ? current : [...current, scenario.id]);
    setFinished(true);
  }

  function advance() {
    if (stageIndex < scenario.stages.length - 1) {
      setStageIndex((current) => current + 1);
      setRevealed(false);
      return;
    }
    finishScenario();
  }

  function repeatNow() {
    setStageIndex(0);
    setRevealed(false);
    setFinished(false);
  }

  function toggleRepeat() {
    setRepeatIds((current) => current.includes(scenario.id) ? current.filter((id) => id !== scenario.id) : [...current, scenario.id]);
  }

  function openRepeatQueue() {
    const nextId = repeatIds[0];
    const nextScenario = training.scenarios.find((item) => item.id === nextId);
    if (nextScenario) openScenario(nextScenario);
  }

  return (
    <section className={styles.trainer} aria-label="Abnormal and emergency scenario trainer">
      <aside className={styles.library}>
        <div className={styles.libraryHeader}>
          <div>
            <p className={styles.kicker}>Scenario library</p>
            <strong>{training.scenarios.length} scenarios</strong>
          </div>
          <span>{completedIds.length}/{training.scenarios.length}</span>
        </div>

        <div className={styles.scenarioList}>
          {training.scenarios.map((item) => {
            const isActive = item.id === scenario.id;
            const isDone = completedIds.includes(item.id);
            const isRepeat = repeatIds.includes(item.id);
            return (
              <button aria-current={isActive ? "true" : undefined} className={`${styles.scenarioButton} ${isActive ? styles.activeScenario : ""}`} key={item.id} onClick={() => openScenario(item)} type="button">
                <span className={styles.scenarioMeta}>{item.category} · {item.phase}</span>
                <strong>{item.title}</strong>
                <small>{item.minutes} min · {item.difficulty === "core" ? "Core" : "Advanced"}{isDone ? " · Completed" : ""}{isRepeat ? " · Repeat" : ""}</small>
              </button>
            );
          })}
        </div>

        <div className={styles.repeatQueue}>
          <div><span>Targeted repeat</span><strong>{repeatIds.length} queued</strong></div>
          <button disabled={repeatIds.length === 0} onClick={openRepeatQueue} type="button">Practice queue</button>
        </div>
      </aside>

      <div className={styles.session}>
        <header className={styles.sessionHeader}>
          <div>
            <p className={styles.kicker}>{scenario.category} · {scenario.phase}</p>
            <h2>{scenario.title}</h2>
            <p>{scenario.summary}</p>
          </div>
          <div className={styles.sessionBadges}>
            <span>{scenario.minutes} min</span>
            <span>{scenario.difficulty === "core" ? "Core scenario" : "Advanced"}</span>
            {completed ? <span>Completed this session</span> : null}
          </div>
        </header>

        <div className={styles.setupCard}>
          <span>Simulator setup</span>
          <p>{scenario.setup}</p>
          <div className={styles.objectives}>{scenario.objectives.map((objective) => <small key={objective}>{objective}</small>)}</div>
        </div>

        <ol className={styles.stageRail} aria-label="Scenario stages">
          {scenario.stages.map((item, index) => (
            <li className={index < stageIndex || finished ? styles.stageDone : index === stageIndex ? styles.stageActive : ""} key={item.id}>
              <span>{index + 1}</span><strong>{stageLabels[item.id]}</strong>
            </li>
          ))}
        </ol>

        {!finished && stage ? (
          <div className={styles.stageCard}>
            <div className={styles.stageTopline}><span>Stage {stageIndex + 1} of {scenario.stages.length}</span><strong>{stageLabels[stage.id]}</strong></div>
            <h3>{stage.prompt}</h3>
            {!revealed ? (
              <div className={styles.revealGate}>
                <p>Say or think through your response before revealing the training answer.</p>
                <button className={styles.primaryButton} onClick={() => setRevealed(true)} type="button">Reveal expected response</button>
              </div>
            ) : (
              <div className={styles.revealedAnswer}>
                <div className={styles.answerBlock}><span>Expected response</span><ul>{stage.expectedResponse.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div className={styles.whyBlock}><span>Why it matters</span><p>{stage.why}</p></div>
                <p className={styles.sourceLine}>Source · {stage.source.map(sourceLabel).join(" · ")}</p>
                <button className={styles.primaryButton} onClick={advance} type="button">{stageIndex === scenario.stages.length - 1 ? "Finish scenario" : "Next stage"} →</button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.debriefCard}>
            <p className={styles.kicker}>Debrief</p>
            <h3>Scenario complete.</h3>
            <ul>{scenario.debrief.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className={styles.debriefActions}>
              <button className={styles.primaryButton} onClick={repeatNow} type="button">Repeat now</button>
              <button className={styles.secondaryButton} onClick={toggleRepeat} type="button">{queuedForRepeat ? "Remove from repeat queue" : "Mark for targeted repeat"}</button>
            </div>
          </div>
        )}

        {scenario.variantNote ? <aside className={styles.variantNote}><strong>Configuration note:</strong> {scenario.variantNote}</aside> : null}
        {scenario.trainingBoundary ? <aside className={styles.boundaryNote}><strong>Training boundary:</strong> {scenario.trainingBoundary}</aside> : null}

        <footer className={styles.sessionFooter}>
          <p>{training.disclaimer}</p>
          <small>{training.sourceNote}</small>
          <small>Completed scenarios are saved on this device; M7 will add account-backed cross-device persistence.</small>
        </footer>
      </div>
    </section>
  );
}
