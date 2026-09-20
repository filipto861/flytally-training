"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { appendBrowserProgress } from "@/lib/browser-progress";
import {
  advanceProcedureGraph,
  isProcedureGraphComplete,
  selectProcedureGraphDecision,
  type ProcedureGraphExecutionState,
} from "@/lib/procedure-graph-runtime";
import { filterProcedures, listProcedurePhases } from "@/lib/procedure-runtime";
import {
  createFreshProcedureGraphSessionState,
  createFreshProcedureSessionSnapshotV2,
  normalizeProcedureSessionSnapshotV2,
  procedureStepKey,
  readProcedureSessionV2,
  shouldEmitProcedureGraphCompletion,
  writeProcedureSessionV2,
  type ProcedureGraphSessionStateV2,
  type ProcedureSessionContextV2,
  type ProcedureSessionSnapshotV2,
} from "@/lib/procedure-session";
import type {
  AircraftGraphProcedure,
  AircraftProcedure,
  AircraftProcedureDefinition,
  TrainingSourceReference,
} from "@/lib/universal-aircraft-content";
import type { ContentSourcePolicy } from "@/lib/source-authority";
import { ProcedureGraphRunner } from "./procedure-graph-runner";
import { ProcedureLinearRunner } from "./procedure-linear-runner";
import styles from "./procedure-browser.module.css";

const ALL_PHASES = "all";

const formatSources = (
  sources: readonly TrainingSourceReference[] | undefined,
): string | undefined =>
  sources
    ?.map((item) =>
      [
        item.chapter ? `Ch ${item.chapter}` : undefined,
        item.section,
        `p. ${item.pageLabel}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .join(" · ");

function isGraphProcedure(
  procedure: AircraftProcedureDefinition,
): procedure is AircraftGraphProcedure {
  return procedure.graph !== undefined;
}

function graphExecutionState(
  state: ProcedureGraphSessionStateV2,
): ProcedureGraphExecutionState {
  return {
    activeNodeId: state.activeNodeId,
    completedNodeIds: state.completedNodeIds,
    branchSelections: state.branchSelections,
  };
}

type ProcedureSessionAction =
  | { readonly type: "selectProcedure"; readonly procedureId: string }
  | { readonly type: "toggleLinearStep"; readonly stepKey: string }
  | { readonly type: "resetLinear"; readonly stepKeys: readonly string[] }
  | {
      readonly type: "advanceGraph";
      readonly procedure: AircraftGraphProcedure;
      readonly fingerprint: string;
      readonly occurredAt: string;
    }
  | {
      readonly type: "selectGraphDecision";
      readonly procedure: AircraftGraphProcedure;
      readonly fingerprint: string;
      readonly optionId: string;
      readonly occurredAt: string;
    }
  | {
      readonly type: "resetGraph";
      readonly procedure: AircraftGraphProcedure;
      readonly fingerprint: string;
    }
  | {
      readonly type: "reconcile";
      readonly effectiveSnapshotId: string;
      readonly context: ProcedureSessionContextV2;
    };

function applyGraphTransition(
  session: ProcedureSessionSnapshotV2,
  procedure: AircraftGraphProcedure,
  fingerprint: string,
  transition:
    | { readonly kind: "advance" }
    | { readonly kind: "decision"; readonly optionId: string },
  occurredAt: string,
): ProcedureSessionSnapshotV2 {
  const stored = session.graphStates[procedure.id];
  const current =
    stored?.definitionFingerprint === fingerprint
      ? stored
      : createFreshProcedureGraphSessionState(procedure, fingerprint);
  const execution = graphExecutionState(current);
  const result =
    transition.kind === "advance"
      ? advanceProcedureGraph(procedure.graph, execution)
      : selectProcedureGraphDecision(procedure.graph, execution, transition.optionId);

  if (!result.ok) return session;

  const complete = isProcedureGraphComplete(procedure.graph, result.value);
  const nextGraphState: ProcedureGraphSessionStateV2 = {
    definitionFingerprint: fingerprint,
    ...result.value,
    ...(current.completionEmittedAt
      ? { completionEmittedAt: current.completionEmittedAt }
      : complete
        ? { completionEmittedAt: occurredAt }
        : {}),
  };

  return {
    ...session,
    graphStates: {
      ...session.graphStates,
      [procedure.id]: nextGraphState,
    },
  };
}

function procedureSessionReducer(
  state: ProcedureSessionSnapshotV2,
  action: ProcedureSessionAction,
): ProcedureSessionSnapshotV2 {
  switch (action.type) {
    case "selectProcedure":
      return state.selectedProcedureId === action.procedureId
        ? state
        : { ...state, selectedProcedureId: action.procedureId };

    case "toggleLinearStep": {
      const next = new Set(state.completedStepKeys);
      if (next.has(action.stepKey)) next.delete(action.stepKey);
      else next.add(action.stepKey);
      return { ...state, completedStepKeys: [...next] };
    }

    case "resetLinear": {
      const removed = new Set(action.stepKeys);
      return {
        ...state,
        completedStepKeys: state.completedStepKeys.filter((key) => !removed.has(key)),
      };
    }

    case "advanceGraph":
      return applyGraphTransition(
        state,
        action.procedure,
        action.fingerprint,
        { kind: "advance" },
        action.occurredAt,
      );

    case "selectGraphDecision":
      return applyGraphTransition(
        state,
        action.procedure,
        action.fingerprint,
        { kind: "decision", optionId: action.optionId },
        action.occurredAt,
      );

    case "resetGraph":
      return {
        ...state,
        graphStates: {
          ...state.graphStates,
          [action.procedure.id]: createFreshProcedureGraphSessionState(
            action.procedure,
            action.fingerprint,
          ),
        },
      };

    case "reconcile":
      return normalizeProcedureSessionSnapshotV2(
        state,
        action.effectiveSnapshotId,
        action.context,
      );
  }
}

function completionMarkers(
  snapshot: ProcedureSessionSnapshotV2,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(snapshot.graphStates).flatMap(([procedureId, graphState]) =>
      graphState.completionEmittedAt
        ? [[procedureId, graphState.completionEmittedAt]]
        : [],
    ),
  );
}

function graphStarted(
  procedure: AircraftGraphProcedure,
  state: ProcedureGraphSessionStateV2 | undefined,
): boolean {
  if (!state) return false;
  return (
    state.activeNodeId !== procedure.graph.entryNodeId ||
    state.completedNodeIds.length > 0 ||
    Object.keys(state.branchSelections).length > 0
  );
}

export function ProcedureBrowser({
  aircraftId,
  procedures,
  selectedVariant,
  effectiveSnapshotId,
  graphFingerprints,
  sourcePolicy,
}: Readonly<{
  aircraftId: string;
  procedures: readonly AircraftProcedureDefinition[];
  selectedVariant?: string;
  effectiveSnapshotId: string;
  graphFingerprints: Readonly<Record<string, string>>;
  sourcePolicy: ContentSourcePolicy;
}>) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState(ALL_PHASES);
  const context = useMemo<ProcedureSessionContextV2>(
    () => ({ procedures, graphFingerprints }),
    [procedures, graphFingerprints],
  );
  const freshForRender = useMemo(
    () => createFreshProcedureSessionSnapshotV2(effectiveSnapshotId, procedures),
    [effectiveSnapshotId, procedures],
  );
  const [initialSession] = useState<ProcedureSessionSnapshotV2>(() => {
    if (typeof window === "undefined") return freshForRender;

    const restored = readProcedureSessionV2(
      window.sessionStorage,
      aircraftId,
      selectedVariant,
      effectiveSnapshotId,
      { procedures, graphFingerprints },
    );
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const hashSelection =
      hash && procedures.some((procedure) => procedure.id === hash) ? hash : undefined;

    return hashSelection
      ? { ...restored, selectedProcedureId: hashSelection }
      : restored;
  });
  const [session, dispatch] = useReducer(procedureSessionReducer, initialSession);
  const [hydrated, setHydrated] = useState(false);
  const emittedCompletionRef = useRef<Record<string, string>>(
    completionMarkers(initialSession),
  );

  const renderedSession = hydrated ? session : freshForRender;
  const completedStepKeys = useMemo(
    () => new Set(renderedSession.completedStepKeys),
    [renderedSession.completedStepKeys],
  );
  const phases = useMemo(() => listProcedurePhases(procedures), [procedures]);
  const visible = useMemo(
    () =>
      filterProcedures(procedures, {
        query,
        phase: phase === ALL_PHASES ? undefined : phase,
      }),
    [procedures, query, phase],
  );
  const selectedId = renderedSession.selectedProcedureId;
  const selected = procedures.find((procedure) => procedure.id === selectedId);
  const selectedIsVisible = Boolean(
    selected && visible.some((procedure) => procedure.id === selected.id),
  );
  const selectedVisibleIndex =
    selected && selectedIsVisible
      ? visible.findIndex((procedure) => procedure.id === selected.id)
      : -1;
  const previousProcedure =
    selectedVisibleIndex > 0 ? visible[selectedVisibleIndex - 1] : undefined;
  const nextProcedure =
    selectedVisibleIndex >= 0 ? visible[selectedVisibleIndex + 1] : undefined;
  const selectedVisibleId = selectedIsVisible && selected ? selected.id : "";

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    dispatch({
      type: "reconcile",
      effectiveSnapshotId,
      context,
    });
  }, [context, effectiveSnapshotId, hydrated]);

  useEffect(() => {
    const selectFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && procedures.some((procedure) => procedure.id === hash)) {
        dispatch({ type: "selectProcedure", procedureId: hash });
      }
    };
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [procedures]);

  useEffect(() => {
    if (!hydrated) return;

    const nextKnown: Record<string, string> = {};
    for (const [procedureId, graphState] of Object.entries(session.graphStates)) {
      const timestamp = graphState.completionEmittedAt;
      if (!timestamp) continue;
      nextKnown[procedureId] = timestamp;

      if (
        !shouldEmitProcedureGraphCompletion(
          emittedCompletionRef.current[procedureId],
          timestamp,
        )
      ) {
        continue;
      }

      appendBrowserProgress({
        aircraftId,
        kind: "procedure",
        contentId: `${procedureId}:variant=${selectedVariant ?? "common"}`,
        occurredAt: timestamp,
        completed: true,
      });
    }
    emittedCompletionRef.current = nextKnown;
  }, [aircraftId, hydrated, selectedVariant, session.graphStates]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeProcedureSessionV2(
        window.sessionStorage,
        aircraftId,
        selectedVariant,
        effectiveSnapshotId,
        session,
      );
    } catch {
      // Keep procedures usable when browser persistence is unavailable.
    }
  }, [aircraftId, effectiveSnapshotId, hydrated, selectedVariant, session]);

  function selectProcedure(id: string) {
    dispatch({ type: "selectProcedure", procedureId: id });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`,
    );
  }

  function clearFilters() {
    setQuery("");
    setPhase(ALL_PHASES);
  }

  function toggleLinearStep(procedure: AircraftProcedure, stepId: string) {
    const stepKey = procedureStepKey(procedure.id, stepId);
    const current = new Set(session.completedStepKeys);
    const next = new Set(current);
    if (next.has(stepKey)) next.delete(stepKey);
    else next.add(stepKey);

    const wasComplete =
      procedure.steps.length > 0 &&
      procedure.steps.every((step) =>
        current.has(procedureStepKey(procedure.id, step.id)),
      );
    const isComplete =
      procedure.steps.length > 0 &&
      procedure.steps.every((step) =>
        next.has(procedureStepKey(procedure.id, step.id)),
      );

    if (!wasComplete && isComplete) {
      appendBrowserProgress({
        aircraftId,
        kind: "procedure",
        contentId: `${procedure.id}:variant=${selectedVariant ?? "common"}`,
        occurredAt: new Date().toISOString(),
        completed: true,
      });
    }

    dispatch({ type: "toggleLinearStep", stepKey });
  }

  function resetSelectedProcedure() {
    if (!selected) return;
    if (isGraphProcedure(selected)) {
      const fingerprint = graphFingerprints[selected.id];
      if (!fingerprint) return;
      dispatch({
        type: "resetGraph",
        procedure: selected,
        fingerprint,
      });
      return;
    }

    dispatch({
      type: "resetLinear",
      stepKeys: selected.steps.map((step) => procedureStepKey(selected.id, step.id)),
    });
  }

  function graphStateFor(
    procedure: AircraftGraphProcedure,
  ): ProcedureGraphSessionStateV2 | undefined {
    const fingerprint = graphFingerprints[procedure.id];
    if (!fingerprint) return undefined;
    const stored = renderedSession.graphStates[procedure.id];
    return stored?.definitionFingerprint === fingerprint
      ? stored
      : createFreshProcedureGraphSessionState(procedure, fingerprint);
  }

  function procedureStatus(procedure: AircraftProcedureDefinition): {
    readonly complete: boolean;
    readonly label: string;
  } {
    if (isGraphProcedure(procedure)) {
      const stored = renderedSession.graphStates[procedure.id];
      const state = graphStateFor(procedure);
      if (!state) return { complete: false, label: "Unavailable" };
      const complete = isProcedureGraphComplete(procedure.graph, graphExecutionState(state));
      if (complete) return { complete: true, label: "Complete" };
      return {
        complete: false,
        label: graphStarted(procedure, stored) ? "In progress" : "Ready",
      };
    }

    const completed = procedure.steps.filter((step) =>
      completedStepKeys.has(procedureStepKey(procedure.id, step.id)),
    ).length;
    const complete = procedure.steps.length > 0 && completed === procedure.steps.length;
    return {
      complete,
      label: `${completed}/${procedure.steps.length}${complete ? " · complete" : ""}`,
    };
  }

  const selectedStatus = selected ? procedureStatus(selected) : undefined;
  const selectedGraphState =
    selected && isGraphProcedure(selected) ? graphStateFor(selected) : undefined;
  const selectedGraphFingerprint =
    selected && isGraphProcedure(selected) ? graphFingerprints[selected.id] : undefined;

  return (
    <section className={styles.browser} aria-label="Procedure workspace">
      {sourcePolicy === "available-sources" ? (
        <p className={styles.sourcePolicyNote}>
          Sources: available training material. Not FAA-approved.
        </p>
      ) : null}
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Action, system, indication…"
          />
        </label>
        <label className={styles.phaseFilter}>
          <span>Phase</span>
          <select value={phase} onChange={(event) => setPhase(event.target.value)}>
            <option value={ALL_PHASES}>All phases</option>
            {phases.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.mobilePicker}>
        <span>Procedure</span>
        <select
          disabled={!visible.length}
          value={selectedVisibleId}
          onChange={(event) => selectProcedure(event.target.value)}
        >
          {!visible.length ? <option value="">No matches</option> : null}
          {visible.length && !selectedIsVisible ? (
            <option value="">Selected procedure is filtered out</option>
          ) : null}
          {visible.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.phase ? `${procedure.phase} · ` : ""}
              {procedure.title}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.layout}>
        <nav className={styles.index} aria-label="Available procedures">
          <div className={styles.indexHeader}>
            <div>
              <strong>{visible.length} procedures</strong>
              <small>{hydrated ? "Progress saved in this tab" : "Restoring…"}</small>
            </div>
            {query || phase !== ALL_PHASES ? (
              <button type="button" onClick={clearFilters}>
                Clear
              </button>
            ) : null}
          </div>
          <div className={styles.indexList}>
            {visible.map((procedure) => {
              const itemStatus = procedureStatus(procedure);
              return (
                <button
                  aria-current={selected?.id === procedure.id ? "page" : undefined}
                  className={`${selected?.id === procedure.id ? styles.active : ""} ${itemStatus.complete ? styles.indexComplete : ""}`}
                  key={procedure.id}
                  onClick={() => selectProcedure(procedure.id)}
                  type="button"
                >
                  <span>{procedure.phase ?? "Procedure"}</span>
                  <strong>{procedure.title}</strong>
                  <small>
                    {itemStatus.label}
                    {itemStatus.complete && isGraphProcedure(procedure) ? " · complete" : ""}
                  </small>
                </button>
              );
            })}
            {!visible.length ? (
              <p className={styles.empty}>No procedure matches the current filters.</p>
            ) : null}
          </div>
        </nav>

        {selected && selectedIsVisible ? (
          <article className={styles.detail} id={selected.id}>
            <header className={styles.detailHeader}>
              <div>
                <p className="eyebrow">{selected.phase ?? "Procedure"}</p>
                <h2>{selected.title}</h2>
                {selected.summary ? <p>{selected.summary}</p> : null}
              </div>
              <div className={styles.detailProgress}>
                <span>{selectedStatus?.label ?? "Ready"}</span>
                <button type="button" onClick={resetSelectedProcedure}>
                  Reset procedure
                </button>
              </div>
            </header>

            {selected.prerequisites?.length ? (
              <section className={styles.metaBlock}>
                <strong>Prerequisites</strong>
                <ul>
                  {selected.prerequisites.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {isGraphProcedure(selected) ? (
              selectedGraphState && selectedGraphFingerprint ? (
                <ProcedureGraphRunner
                  procedure={selected}
                  state={graphExecutionState(selectedGraphState)}
                  onAdvance={() =>
                    dispatch({
                      type: "advanceGraph",
                      procedure: selected,
                      fingerprint: selectedGraphFingerprint,
                      occurredAt: new Date().toISOString(),
                    })
                  }
                  onSelectDecision={(optionId) =>
                    dispatch({
                      type: "selectGraphDecision",
                      procedure: selected,
                      fingerprint: selectedGraphFingerprint,
                      optionId,
                      occurredAt: new Date().toISOString(),
                    })
                  }
                />
              ) : (
                <div className={styles.noSelection}>
                  Procedure definition fingerprint is unavailable.
                </div>
              )
            ) : (
              <ProcedureLinearRunner
                procedure={selected}
                completedStepKeys={completedStepKeys}
                onToggleStep={(stepId) => toggleLinearStep(selected, stepId)}
              />
            )}

            {selected.completionCriteria?.length ? (
              <section className={styles.metaBlock}>
                <strong>Complete when</strong>
                <ul>
                  {selected.completionCriteria.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {formatSources(selected.sources) ? (
              <p className={styles.procedureSource}>
                <small>Procedure source · {formatSources(selected.sources)}</small>
              </p>
            ) : null}

            <footer className={styles.procedureNavigation}>
              {previousProcedure ? (
                <button type="button" onClick={() => selectProcedure(previousProcedure.id)}>
                  ← {previousProcedure.title}
                </button>
              ) : (
                <span />
              )}
              {selectedStatus?.complete ? (
                <strong>Complete ✓</strong>
              ) : (
                <span>{selectedStatus?.label ?? "Ready"}</span>
              )}
              {nextProcedure ? (
                <button type="button" onClick={() => selectProcedure(nextProcedure.id)}>
                  {nextProcedure.title} →
                </button>
              ) : (
                <span />
              )}
            </footer>
          </article>
        ) : selected ? (
          <div className={styles.noSelection}>
            Selected procedure is filtered out by the current filters.
          </div>
        ) : (
          <div className={styles.noSelection}>Choose a procedure.</div>
        )}
      </div>
    </section>
  );
}
