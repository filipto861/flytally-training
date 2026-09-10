"use client";

import { useEffect, useMemo, useState } from "react";

import { filterProcedures, listProcedurePhases } from "@/lib/procedure-runtime";
import type { AircraftProcedure, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./procedure-browser.module.css";

const ALL_PHASES = "all";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export function ProcedureBrowser({ procedures }: Readonly<{ procedures: readonly AircraftProcedure[] }>) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState(ALL_PHASES);
  const [selectedId, setSelectedId] = useState(procedures[0]?.id ?? "");
  const phases = useMemo(() => listProcedurePhases(procedures), [procedures]);
  const visible = useMemo(() => filterProcedures(procedures, { query, phase: phase === ALL_PHASES ? undefined : phase }), [procedures, query, phase]);
  const selected = procedures.find((procedure) => procedure.id === selectedId) ?? visible[0];

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && procedures.some((procedure) => procedure.id === hash)) setSelectedId(hash);
  }, [procedures]);

  useEffect(() => {
    if (visible.length && !visible.some((procedure) => procedure.id === selectedId)) setSelectedId(visible[0].id);
  }, [selectedId, visible]);

  function selectProcedure(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`);
  }

  function clearFilters() {
    setQuery("");
    setPhase(ALL_PHASES);
  }

  return (
    <section className={styles.browser} aria-label="Procedure browser">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span>Search procedures</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, system, indication…" />
        </label>
        <label className={styles.phaseFilter}>
          <span>Phase</span>
          <select value={phase} onChange={(event) => setPhase(event.target.value)}>
            <option value={ALL_PHASES}>All phases</option>
            {phases.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className={styles.layout}>
        <nav className={styles.index} aria-label="Available procedures">
          <div className={styles.indexHeader}><strong>{visible.length} procedures</strong>{query || phase !== ALL_PHASES ? <button type="button" onClick={clearFilters}>Clear</button> : null}</div>
          {visible.map((procedure) => (
            <button aria-current={selected?.id === procedure.id ? "page" : undefined} className={selected?.id === procedure.id ? styles.active : undefined} key={procedure.id} onClick={() => selectProcedure(procedure.id)} type="button">
              <span>{procedure.phase ?? "Procedure"}</span>
              <strong>{procedure.title}</strong>
            </button>
          ))}
          {!visible.length ? <p className={styles.empty}>No procedure matches the current filters.</p> : null}
        </nav>

        {selected && visible.some((procedure) => procedure.id === selected.id) ? (
          <article className={styles.detail} id={selected.id}>
            <header>
              <p className="eyebrow">{selected.phase ?? "Procedure"}</p>
              <h2>{selected.title}</h2>
              {selected.summary ? <p>{selected.summary}</p> : null}
            </header>

            {selected.prerequisites?.length ? (
              <section className={styles.metaBlock}>
                <strong>Prerequisites</strong>
                <ul>{selected.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}

            <ol className={styles.steps}>
              {selected.steps.map((step, index) => {
                const sourceLabel = formatSources(step.sources);
                return (
                  <li key={step.id}>
                    <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <div className={styles.stepBody}>
                      <strong className={styles.action}>{step.action}</strong>
                      {step.expectedResult ? <p><span>Expected</span>{step.expectedResult}</p> : null}
                      {step.verification ? <p><span>Verify</span>{step.verification}</p> : null}
                      {step.rationale ? <p><span>Why</span>{step.rationale}</p> : null}
                      {step.notices?.map((notice, noticeIndex) => <p className={styles[notice.kind]} key={`${step.id}-${notice.kind}-${noticeIndex}`}><span>{notice.kind.toUpperCase()}</span>{notice.text}</p>)}
                      {sourceLabel ? <small>Source · {sourceLabel}</small> : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            {selected.completionCriteria?.length ? (
              <section className={styles.metaBlock}>
                <strong>Complete when</strong>
                <ul>{selected.completionCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}
            {formatSources(selected.sources) ? <p className={styles.procedureSource}><small>Procedure source · {formatSources(selected.sources)}</small></p> : null}
          </article>
        ) : <div className={styles.noSelection}>Choose a procedure from the list.</div>}
      </div>
    </section>
  );
}
