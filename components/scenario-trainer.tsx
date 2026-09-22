"use client";

import { useReducer } from "react";

import type {
  RuntimeAbnormalScenario,
  RuntimeAbnormalTraining,
  RuntimeScenarioSource,
} from "@/lib/abnormal-runtime";
import { appendBrowserProgress } from "@/lib/browser-progress";
import {
  initialScenarioSessionState,
  scenarioSessionReducer,
} from "@/lib/scenario-session";
import styles from "./scenario-trainer.module.css";

function sourceLabel(reference: RuntimeScenarioSource): string {
  return [
    reference.manualId,
    reference.chapter ? `Ch ${reference.chapter}` : undefined,
    reference.section,
    `p. ${reference.pageLabel}`,
  ].filter(Boolean).join(" · ");
}

export function ScenarioTrainer({ training }: Readonly<{ training: RuntimeAbnormalTraining }>) {
  const [session, dispatch] = useReducer(
    scenarioSessionReducer,
    training.scenarios[0]?.id,
    initialScenarioSessionState,
  );

  const {
    selectedId,
    stageIndex,
    revealed,
    finished,
    completedIds,
    repeatIds,
  } = session;

  const scenario = training.scenarios.find((item) => item.id === selectedId) ?? training.scenarios[0];
  if (!scenario) return null;

  const stage = scenario.stages[stageIndex];
  const completed = completedIds.includes(scenario.id);
  const queuedForRepeat = repeatIds.includes(scenario.id);

  function openScenario(nextScenario: RuntimeAbnormalScenario) {
    dispatch({ type: "select", scenarioId: nextScenario.id });
  }

  function advance() {
    const completing =
      stageIndex >= scenario.stages.length - 1 &&
      !completedIds.includes(scenario.id);
    if (completing) {
      appendBrowserProgress({
        aircraftId: training.aircraftId,
        kind: "scenario",
        contentId: scenario.id,
        occurredAt: new Date().toISOString(),
        completed: true,
      });
    }
    dispatch({
      type: "advance",
      scenarioId: scenario.id,
      stageCount: scenario.stages.length,
    });
  }

  function repeatNow() {
    dispatch({ type: "repeat-now" });
  }

  function toggleRepeat() {
    dispatch({ type: "toggle-repeat", scenarioId: scenario.id });
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
          <span>Scenario setup</span>
          <p>{scenario.setup}</p>
          <div className={styles.objectives}>{scenario.objectives.map((objective) => <small key={objective}>{objective}</small>)}</div>
        </div>

        {scenario.notices?.map((notice, index) => (
          <aside className={styles.boundaryNote} key={`${scenario.id}-notice-${index}`}><strong>{notice.kind.toUpperCase()}:</strong> {notice.text}</aside>
        ))}

        <ol className={styles.stageRail} aria-label="Scenario stages">
          {scenario.stages.map((item, index) => (
            <li className={index < stageIndex || finished ? styles.stageDone : index === stageIndex ? styles.stageActive : ""} key={item.id}>
              <span>{index + 1}</span><strong>{item.label}</strong>
            </li>
          ))}
        </ol>

        {!finished && stage ? (
          <div className={styles.stageCard}>
            <div className={styles.stageTopline}><span>Stage {stageIndex + 1} of {scenario.stages.length}</span><strong>{stage.label}</strong></div>
            <h3>{stage.prompt}</h3>
            {!revealed ? (
              <div className={styles.revealGate}>
                <p>Say or think through your response before revealing the training answer.</p>
                <button className={styles.primaryButton} onClick={() => dispatch({ type: "reveal" })} type="button">Reveal expected response</button>
              </div>
            ) : (
              <div className={styles.revealedAnswer}>
                <div className={styles.answerBlock}><span>Expected response</span><ul>{stage.expectedResponse.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div className={styles.whyBlock}><span>Why it matters</span><p>{stage.explanation}</p></div>
                {stage.notices?.map((notice, index) => <p className={styles.sourceLine} key={`${stage.id}-notice-${index}`}><strong>{notice.kind.toUpperCase()}:</strong> {notice.text}</p>)}
                <p className={styles.sourceLine}>Source · {stage.sources.map(sourceLabel).join(" · ")}</p>
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

        {scenario.configurationNote ? <aside className={styles.variantNote}><strong>Configuration note:</strong> {scenario.configurationNote}</aside> : null}
        {scenario.boundaryNote ? <aside className={styles.boundaryNote}><strong>Training boundary:</strong> {scenario.boundaryNote}</aside> : null}

        <footer className={styles.sessionFooter}>
          {training.disclaimer ? <p>{training.disclaimer}</p> : null}
          {training.sourceNote ? <small>{training.sourceNote}</small> : null}
          <small>Completed scenarios use the shared FlyTally aircraft progress stream.</small>
        </footer>
      </div>
    </section>
  );
}
