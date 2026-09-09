"use client";

import { useMemo, useState } from "react";

import type { AircraftReferenceKnowledge } from "@/lib/reference-knowledge";
import styles from "./m6-training.module.css";

export function KnowledgeTrainer({ content }: Readonly<{ content: AircraftReferenceKnowledge }>) {
  const areas = useMemo(() => [...new Set(content.questions.map((question) => question.area))], [content.questions]);
  const [area, setArea] = useState("all");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const questions = useMemo(
    () => area === "all" ? content.questions : content.questions.filter((question) => question.area === area),
    [area, content.questions],
  );

  const safeIndex = Math.min(index, Math.max(questions.length - 1, 0));
  const question = questions[safeIndex];
  const answered = question ? answers[question.id] : undefined;
  const choice = selected ?? answered ?? null;
  const revealed = answered !== undefined;

  const attempted = Object.keys(answers).length;
  const correct = content.questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const weakAreas = areas.filter((candidateArea) => {
    const areaQuestions = content.questions.filter((question) => question.area === candidateArea && answers[question.id] !== undefined);
    return areaQuestions.length > 0 && areaQuestions.some((question) => answers[question.id] !== question.correctIndex);
  });

  function changeArea(nextArea: string) {
    setArea(nextArea);
    setIndex(0);
    setSelected(null);
  }

  function submit() {
    if (!question || selected === null) return;
    setAnswers((current) => ({ ...current, [question.id]: selected }));
  }

  function next() {
    if (safeIndex < questions.length - 1) {
      setIndex(safeIndex + 1);
      setSelected(null);
    }
  }

  function previous() {
    if (safeIndex > 0) {
      setIndex(safeIndex - 1);
      setSelected(null);
    }
  }

  if (!question) return null;

  return (
    <section className={styles.quizShell} aria-label="Knowledge trainer">
      <aside className={styles.quizSidebar}>
        <h2>Question bank</h2>
        <div className={styles.areaList}>
          <button aria-pressed={area === "all"} type="button" onClick={() => changeArea("all")}>All areas</button>
          {areas.map((candidateArea) => (
            <button aria-pressed={area === candidateArea} key={candidateArea} type="button" onClick={() => changeArea(candidateArea)}>
              {candidateArea}
            </button>
          ))}
        </div>
        <div className={styles.scoreCard}>
          <strong>{correct} correct · {attempted} attempted</strong>
          <p>Results are session-local until M7 persistence is connected.</p>
        </div>
        {weakAreas.length ? (
          <div className={styles.weakList} aria-label="Weak areas">
            {weakAreas.map((weakArea) => <span key={weakArea}>{weakArea}</span>)}
          </div>
        ) : null}
      </aside>

      <article className={styles.quizCard}>
        <div className={styles.quizMeta}>
          <span>{question.area}</span>
          <span>{safeIndex + 1} / {questions.length}</span>
        </div>
        <h2>{question.prompt}</h2>
        <div className={styles.choices}>
          {question.choices.map((option, optionIndex) => {
            const correctChoice = revealed && optionIndex === question.correctIndex;
            const wrongChoice = revealed && optionIndex === choice && optionIndex !== question.correctIndex;
            const className = [styles.choice, optionIndex === choice ? styles.choiceSelected : "", correctChoice ? styles.choiceCorrect : "", wrongChoice ? styles.choiceWrong : ""].filter(Boolean).join(" ");
            return (
              <button
                className={className}
                disabled={revealed}
                key={option}
                type="button"
                onClick={() => setSelected(optionIndex)}
              >
                <span>{String.fromCharCode(65 + optionIndex)}.</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <div className={styles.quizActions}>
            <button type="button" onClick={previous} disabled={safeIndex === 0}>← Previous</button>
            <button type="button" onClick={submit} disabled={selected === null}>Check answer</button>
          </div>
        ) : (
          <>
            <div className={styles.feedback}>
              <strong>{choice === question.correctIndex ? "Correct" : "Review this area"}</strong>
              <p>{question.explanation}</p>
              <small className={styles.source}>Source · {question.source.map((source) => `Ch ${source.chapter} · ${source.section} · p. ${source.manualPage}`).join(" · ")}</small>
            </div>
            <div className={styles.quizActions}>
              <button type="button" onClick={previous} disabled={safeIndex === 0}>← Previous</button>
              <button type="button" onClick={next} disabled={safeIndex === questions.length - 1}>Next →</button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
