"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  OperationalEmergencyContent,
  OperationalEmergencyNotice,
  OperationalEmergencyScenario,
  OperationalEmergencySource,
  OperationalEmergencyStep,
} from "@/lib/operational-flight-data";
import styles from "./operational-emergency.module.css";

const ALL_CATEGORIES = "__all__";

function noticeClass(kind: OperationalEmergencyNotice["kind"]): string {
  if (kind === "warning") return styles.warning;
  if (kind === "caution") return styles.caution;
  return styles.note;
}

function sourceLabel(source: OperationalEmergencySource): string {
  return [source.manualId, source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`]
    .filter(Boolean)
    .join(" · ");
}

function Notice({ notice }: Readonly<{ notice: OperationalEmergencyNotice }>) {
  return <div className={`${styles.notice} ${noticeClass(notice.kind)}`}>
    <strong>{notice.kind.toUpperCase()}</strong>
    <span>{notice.text}</span>
  </div>;
}

function stepSources(step: OperationalEmergencyStep): readonly OperationalEmergencySource[] {
  if (step.kind === "action" || step.kind === "information") return step.sources;
  return [
    ...step.sources,
    ...step.branches.flatMap((branch) => branch.steps.flatMap(stepSources)),
  ];
}

function Steps({ steps }: Readonly<{ steps: readonly OperationalEmergencyStep[] }>) {
  return <ol className={styles.actions}>
    {steps.map((step) => {
      if (step.kind === "action") {
        return <li className={step.memoryItem ? styles.memoryAction : undefined} key={step.id}>
          <span>{step.label ?? "•"}</span>
          <div className={styles.actionBody}>
            <strong>{step.text}</strong>
            {step.notices?.length ? <div className={styles.notices}>
              {step.notices.map((notice, index) => <Notice key={`${step.id}-notice-${index}`} notice={notice} />)}
            </div> : null}
          </div>
        </li>;
      }

      if (step.kind === "information") {
        return <li className={`${styles.informationStep}${step.memoryItem ? ` ${styles.memoryInformation}` : ""}`} key={step.id}>
          <span>{step.label ?? "i"}</span>
          <div className={styles.actionBody}>
            <p>{step.text}</p>
            {step.notices?.length ? <div className={styles.notices}>
              {step.notices.map((notice, index) => <Notice key={`${step.id}-notice-${index}`} notice={notice} />)}
            </div> : null}
          </div>
        </li>;
      }

      return <li className={styles.conditionStep} key={step.id}>
        {step.notices?.length ? <div className={styles.notices}>
          {step.notices.map((notice, index) => <Notice key={`${step.id}-notice-${index}`} notice={notice} />)}
        </div> : null}
        <div className={styles.conditionBranches}>
          {step.branches.map((branch) => <section className={styles.conditionBranch} key={branch.id}>
            <h3>{branch.label}</h3>
            <Steps steps={branch.steps} />
          </section>)}
        </div>
      </li>;
    })}
  </ol>;
}

function Scenario({ scenario }: Readonly<{ scenario: OperationalEmergencyScenario }>) {
  const sources = [...new Set(
    scenario.stages.flatMap((stage) => [
      ...stage.sources.map(sourceLabel),
      ...stage.steps.flatMap(stepSources).map(sourceLabel),
    ]),
  )];

  return <article className={styles.procedure}>
    <header className={styles.procedureHeader}>
      <div>
        <span>{scenario.procedureClass.toUpperCase()}</span>
        <h1>{scenario.title}</h1>
      </div>
      <div className={styles.meta}>
        <span>{scenario.category}</span>
        {scenario.phase ? <span>{scenario.phase}</span> : null}
      </div>
      {scenario.configurationNote ? <p>{scenario.configurationNote}</p> : null}
    </header>

    {scenario.notices?.length ? <div className={styles.notices}>
      {scenario.notices.map((notice, index) => <Notice key={`${scenario.id}-notice-${index}`} notice={notice} />)}
    </div> : null}

    <div className={styles.stages}>
      {scenario.stages.map((stage) => <section className={`${styles.stage}${stage.memoryItem ? ` ${styles.immediate}` : ""}`} key={stage.id}>
        <h2>{stage.label}</h2>
        {stage.notices?.length ? <div className={styles.notices}>
          {stage.notices.map((notice, index) => <Notice key={`${stage.id}-notice-${index}`} notice={notice} />)}
        </div> : null}
        <Steps steps={stage.steps} />
      </section>)}
    </div>

    <details className={styles.authority}>
      <summary>Source &amp; authority</summary>
      {sources.map((source) => <p key={source}>{source}</p>)}
      {scenario.boundaryNote ? <p>{scenario.boundaryNote}</p> : null}
      <p>Current approved aircraft documents remain authoritative.</p>
    </details>
  </article>;
}

export function OperationalEmergency({ emergency }: Readonly<{ emergency: OperationalEmergencyContent }>) {
  const categories = useMemo(
    () => [...new Set(emergency.scenarios.map((scenario) => scenario.category))],
    [emergency.scenarios],
  );
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [scenarioId, setScenarioId] = useState(emergency.scenarios[0]?.id ?? "");
  const [indexCollapsed, setIndexCollapsed] = useState(false);
  const indexOriginRef = useRef<HTMLSpanElement | null>(null);
  const filteredScenarios = category === ALL_CATEGORIES
    ? emergency.scenarios
    : emergency.scenarios.filter((candidate) => candidate.category === category);
  const scenario = filteredScenarios.find((candidate) => candidate.id === scenarioId) ?? filteredScenarios[0] ?? emergency.scenarios[0];
  const sectionIntroduction = scenario
    ? emergency.sectionIntroductions.find((section) => section.procedureClass === scenario.procedureClass)
    : undefined;

  useEffect(() => {
    const updateCollapsedState = () => {
      if (!window.matchMedia("(max-width: 700px)").matches) {
        setIndexCollapsed(false);
        return;
      }
      const origin = indexOriginRef.current;
      if (!origin) return;
      const originY = origin.getBoundingClientRect().top + window.scrollY;
      setIndexCollapsed(window.scrollY > originY + 170);
    };

    updateCollapsedState();
    window.addEventListener("scroll", updateCollapsedState, { passive: true });
    window.addEventListener("resize", updateCollapsedState);
    return () => {
      window.removeEventListener("scroll", updateCollapsedState);
      window.removeEventListener("resize", updateCollapsedState);
    };
  }, []);

  if (!scenario) return null;

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    if (nextCategory === ALL_CATEGORIES) return;
    const current = emergency.scenarios.find((candidate) => candidate.id === scenarioId);
    if (current?.category === nextCategory) return;
    const first = emergency.scenarios.find((candidate) => candidate.category === nextCategory);
    if (first) setScenarioId(first.id);
  }

  function expandQuickAccess() {
    setIndexCollapsed(false);
    const origin = indexOriginRef.current;
    if (!origin) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const originY = origin.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, originY - 118), behavior: reducedMotion ? "auto" : "smooth" });
  }

  return <section className={styles.emergency} aria-label="QRH quick reference">
    <span aria-hidden="true" className={styles.indexSentinel} ref={indexOriginRef} />
    <div className={`${styles.index}${indexCollapsed ? ` ${styles.indexCollapsed}` : ""}`}>
      <button
        aria-expanded={!indexCollapsed}
        className={styles.compactIndex}
        onClick={expandQuickAccess}
        type="button"
      >
        <span>
          <small>{scenario.category}</small>
          <strong>{scenario.title}</strong>
        </span>
        <span aria-hidden="true">⌄</span>
      </button>

      <div className={styles.indexExpanded}>
        <div className={styles.indexHeader}>
          <strong>Quick access</strong>
          <span>{emergency.scenarios.length} procedures</span>
        </div>
        <div className={styles.categories} role="group" aria-label="QRH categories">
          <button
            aria-pressed={category === ALL_CATEGORIES}
            className={category === ALL_CATEGORIES ? styles.activeCategory : undefined}
            onClick={() => chooseCategory(ALL_CATEGORIES)}
            type="button"
          >All <span>{emergency.scenarios.length}</span></button>
          {categories.map((item) => {
            const count = emergency.scenarios.filter((scenarioItem) => scenarioItem.category === item).length;
            return <button
              aria-pressed={category === item}
              className={category === item ? styles.activeCategory : undefined}
              key={item}
              onClick={() => chooseCategory(item)}
              type="button"
            >{item} <span>{count}</span></button>;
          })}
        </div>

        <label className={styles.selector}>
          <span>QRH procedure</span>
          <select aria-label="QRH procedure" value={scenario.id} onChange={(event) => setScenarioId(event.target.value)}>
            {filteredScenarios.map((candidate) => <option key={candidate.id} value={candidate.id}>
              {category === ALL_CATEGORIES ? `${candidate.category} · ${candidate.title}` : candidate.title}
            </option>)}
          </select>
        </label>

        {category !== ALL_CATEGORIES ? <div className={styles.quickProcedures} aria-label={`${category} procedures`}>
          {filteredScenarios.map((candidate) => <button
            aria-current={candidate.id === scenario.id ? "true" : undefined}
            className={candidate.id === scenario.id ? styles.activeProcedure : undefined}
            key={candidate.id}
            onClick={() => setScenarioId(candidate.id)}
            type="button"
          >
            <strong>{candidate.title}</strong>
            <span>{candidate.procedureClass}{candidate.phase ? ` · ${candidate.phase}` : ""}</span>
          </button>)}
        </div> : null}
      </div>
    </div>

    {sectionIntroduction ? <details className={styles.sectionIntroduction}>
      <summary>{sectionIntroduction.procedureClass === "emergency" ? "Emergency" : "Abnormal"} section guidance</summary>
      {sectionIntroduction.notices?.map((notice, index) => <Notice key={`section-notice-${index}`} notice={notice} />)}
      {sectionIntroduction.paragraphs.map((paragraph, index) => <p key={`section-paragraph-${index}`}>{paragraph}</p>)}
    </details> : null}

    <Scenario scenario={scenario} />
  </section>;
}
