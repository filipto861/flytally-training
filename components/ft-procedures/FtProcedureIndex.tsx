"use client";

import type { AircraftProcedureDefinition } from "@/lib/universal-aircraft-content";

import styles from "./ft-procedures.module.css";

export type FtProcedureStatus = {
  readonly complete: boolean;
  readonly label: string;
};

export type FtProcedureIndexProps = {
  readonly procedures: readonly AircraftProcedureDefinition[];
  readonly selectedProcedureId: string | null;
  readonly onSelectProcedure: (procedureId: string) => void;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (query: string) => void;
  readonly phaseFilter: string;
  readonly allPhasesValue: string;
  readonly onPhaseFilterChange: (phase: string) => void;
  readonly availablePhases: readonly string[];
  readonly statuses: Readonly<Record<string, FtProcedureStatus>>;
  readonly progressPersistenceLabel: string;
  readonly onClearFilters: () => void;
};

export function FtProcedureIndex({
  procedures,
  selectedProcedureId,
  onSelectProcedure,
  searchQuery,
  onSearchQueryChange,
  phaseFilter,
  allPhasesValue,
  onPhaseFilterChange,
  availablePhases,
  statuses,
  progressPersistenceLabel,
  onClearFilters,
}: FtProcedureIndexProps) {
  const selectedVisibleId =
    selectedProcedureId &&
    procedures.some((procedure) => procedure.id === selectedProcedureId)
      ? selectedProcedureId
      : "";
  const filtersActive = Boolean(searchQuery || phaseFilter !== allPhasesValue);

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Search</span>
          <input
            aria-label="Search procedures"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Action, system, indication…"
          />
        </label>

        <label className={styles.phaseField}>
          <span>Phase</span>
          <select
            aria-label="Procedure phase"
            value={phaseFilter}
            onChange={(event) => onPhaseFilterChange(event.target.value)}
          >
            <option value={allPhasesValue}>All phases</option>
            {availablePhases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className={styles.indexPanel} aria-label="Available procedures">
        <div className={styles.indexHeader}>
          <div>
            <strong>{procedures.length} procedures</strong>
            <span>{progressPersistenceLabel}</span>
          </div>
          {filtersActive ? (
            <button type="button" onClick={onClearFilters}>
              Clear
            </button>
          ) : null}
        </div>

        <div className={styles.indexList}>
          {procedures.map((procedure) => {
            const selected = selectedProcedureId === procedure.id;
            const status = statuses[procedure.id];

            return (
              <button
                key={procedure.id}
                type="button"
                className={styles.indexButton}
                aria-current={selected ? "page" : undefined}
                data-complete={status?.complete ? "true" : "false"}
                onClick={() => onSelectProcedure(procedure.id)}
              >
                <span>{procedure.phase ?? "Procedure"}</span>
                <strong>{procedure.title}</strong>
                <small>{status?.label ?? "Ready"}</small>
              </button>
            );
          })}

          {!procedures.length ? (
            <p className={styles.indexEmpty}>No procedure matches the current filters.</p>
          ) : null}
        </div>
      </nav>

      <label className={styles.mobilePicker}>
        <span>Procedure</span>
        <select
          aria-label="Procedure"
          disabled={!procedures.length}
          value={selectedVisibleId}
          onChange={(event) => onSelectProcedure(event.target.value)}
        >
          {!procedures.length ? <option value="">No matches</option> : null}
          {procedures.length && !selectedVisibleId ? (
            <option value="">Selected procedure is filtered out</option>
          ) : null}
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.phase ? `${procedure.phase} · ` : ""}
              {procedure.title}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
