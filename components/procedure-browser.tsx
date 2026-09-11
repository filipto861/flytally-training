"use client";

import { useEffect, useMemo, useState } from "react";

import { appendBrowserProgress } from "@/lib/browser-progress";
import { filterProcedures, listProcedurePhases } from "@/lib/procedure-runtime";
import {
  normalizeProcedureSessionSnapshot,
  procedureProgress,
  procedureSessionStorageKey,
  procedureStepKey,
} from "@/lib/procedure-session";
import type { AircraftProcedure, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./procedure-browser.module.css";

const ALL_PHASES = "all";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export function ProcedureBrowser({
  aircraftId,
  procedures,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  procedures: readonly AircraftProcedure[];
  selectedVariant?: string;
}>) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState(ALL_PHASES);
  const [selectedId, setSelectedId] = useState(procedures[0]?.id ?? "");
  const [completedStepKeys, setCompletedStepKeys] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  const phases = useMemo(() => listProcedurePhases(procedures), [procedures]);
  const visible = useMemo(
    () => filterProcedures(procedures, { query, phase: phase === ALL_PHASES ? undefined : phase }),
    [procedures, query, phase],
  );
  const selected = procedures.find((procedure) => procedure.id === selectedId) ?? visible[0];
  const progress = useMemo(() => procedureProgress(procedures, completedStepKeys), [procedures, completedStepKeys]);
  const selectedProgress = progress.find((item) => item.procedureId === selected?.id);
  const selectedVisibleIndex = selected ? visible.findIndex((procedure) => procedure.id === selected.id) : -1;
  const previousProcedure = selectedVisibleIndex > 0 ? visible[selectedVisibleIndex - 1] : undefined;
  const nextProcedure = selectedVisibleIndex >= 0 ? visible[selectedVisibleIndex + 1] : undefined;
  const storageKey = useMemo(
    () => procedureSessionStorageKey(aircraftId, selectedVariant),
    [aircraftId, selectedVariant],
  );

  useEffect(() => {
    let stored: unknown;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      stored = raw ? JSON.parse(raw) : undefined;
    } catch {
      stored = undefined;
    }
    const snapshot = normalizeProcedureSessionSnapshot(stored, procedures);
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const hashSelection = hash && procedures.some((procedure) => procedure.id === hash) ? hash : undefined;
    setSelectedId(hashSelection ?? snapshot.selectedProcedureId);
    setCompletedStepKeys(new Set(snapshot.completedStepKeys));
    setHydrated(true);
  }, [procedures, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        version: 1,
        selectedProcedureId: selectedId,
        completedStepKeys: [...completedStepKeys],
      }));
    } catch {
      // Procedures remain fully usable when sessionStorage is unavailable.
    }
  }, [completedStepKeys, hydrated, selectedId, storageKey]);

  useEffect(() => {
    const selectFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && procedures.some((procedure) => procedure.id === hash)) setSelectedId(hash);
    };
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
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

  function toggleStep(procedure: AircraftProcedure, stepId: string) {
    const key = procedureStepKey(procedure.id, stepId);
    setCompletedStepKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      const wasComplete = procedure.steps.length > 0 && procedure.steps.every((step) => current.has(procedureStepKey(procedure.id, step.id)));
      const isComplete = procedure.steps.length > 0 && procedure.steps.every((step) => next.has(procedureStepKey(procedure.id, step.id)));
      if (!wasComplete && isComplete) {
        appendBrowserProgress({
          aircraftId,
          kind: "procedure",
          contentId: `${procedure.id}:variant=${selectedVariant ?? "common"}`,
          occurredAt: new Date().toISOString(),
          completed: true,
        });
      }
      return next;
    });
  }

  function resetSelectedProcedure() {
    if (!selected) return;
    const selectedKeys = new Set(selected.steps.map((step) => procedureStepKey(selected.id, step.id)));
    setCompletedStepKeys((current) => new Set([...current].filter((key) => !selectedKeys.has(key))));
  }

  return (
    <section className={styles.browser} aria-label="Procedure workspace">
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
          <div className={styles.indexHeader}>
            <div><strong>{visible.length} procedures</strong><small>{hydrated ? "Session progress saved in this tab" : "Restoring session…"}</small></div>
            {query || phase !== ALL_PHASES ? <button type="button" onClick={clearFilters}>Clear</button> : null}
          </div>
          <div className={styles.indexList}>
            {visible.map((procedure) => {
              const itemProgress = progress.find((item) => item.procedureId === procedure.id);
              return (
                <button aria-current={selected?.id === procedure.id ? "page" : undefined} className={`${selected?.id === procedure.id ? styles.active : ""} ${itemProgress?.complete ? styles.indexComplete : ""}`} key={procedure.id} onClick={() => selectProcedure(procedure.id)} type="button">
                  <span>{procedure.phase ?? "Procedure"}</span>
                  <strong>{procedure.title}</strong>
                  <small>{itemProgress?.completedSteps ?? 0}/{itemProgress?.totalSteps ?? procedure.steps.length} steps{itemProgress?.complete ? " · complete" : ""}</small>
                </button>
              );
            })}
            {!visible.length ? <p className={styles.empty}>No procedure matches the current filters.</p> : null}
          </div>
        </nav>

        {selected && visible.some((procedure) => procedure.id === selected.id) ? (
          <article className={styles.detail} id={selected.id}>
            <header className={styles.detailHeader}>
              <div>
                <p className="eyebrow">{selected.phase ?? "Procedure"}</p>
                <h2>{selected.title}</h2>
                {selected.summary ? <p>{selected.summary}</p> : null}
              </div>
              <div className={styles.detailProgress}>
                <span>{selectedProgress?.completedSteps ?? 0} / {selected.steps.length} steps</span>
                <button type="button" onClick={resetSelectedProcedure}>Reset procedure</button>
              </div>
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
                const stepKey = procedureStepKey(selected.id, step.id);
                const complete = completedStepKeys.has(stepKey);
                return (
                  <li className={complete ? styles.stepComplete : undefined} key={step.id}>
                    <button className={styles.stepCheck} aria-label={`${complete ? "Uncheck" : "Complete"} procedure step ${index + 1}`} aria-pressed={complete} onClick={() => toggleStep(selected, step.id)} type="button"><span aria-hidden="true" /></button>
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

            <footer className={styles.procedureNavigation}>
              {previousProcedure ? <button type="button" onClick={() => selectProcedure(previousProcedure.id)}>← {previousProcedure.title}</button> : <span />}
              {selectedProgress?.complete ? <strong>Procedure complete ✓</strong> : <span>{selectedProgress?.completedSteps ?? 0} of {selected.steps.length} complete</span>}
              {nextProcedure ? <button type="button" onClick={() => selectProcedure(nextProcedure.id)}>{nextProcedure.title} →</button> : <span />}
            </footer>
          </article>
        ) : <div className={styles.noSelection}>Choose a procedure from the list.</div>}
      </div>
    </section>
  );
}
