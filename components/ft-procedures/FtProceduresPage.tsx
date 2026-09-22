"use client";

import type { ContentSourcePolicy } from "@/lib/source-authority";
import type { AircraftProcedureDefinition } from "@/lib/universal-aircraft-content";

import { FtProcedureDetail } from "./FtProcedureDetail";
import {
  FtProcedureIndex,
  type FtProcedureStatus,
} from "./FtProcedureIndex";
import type { FtProcedureOperateProps } from "./FtProcedureOperate";
import styles from "./ft-procedures.module.css";

export type FtProceduresPageProps = {
  readonly procedures: readonly AircraftProcedureDefinition[];
  readonly visibleProcedures: readonly AircraftProcedureDefinition[];
  readonly selectedProcedure: AircraftProcedureDefinition | undefined;
  readonly selectedProcedureId: string | null;
  readonly selectedProcedureIsVisible: boolean;
  readonly onSelectProcedure: (procedureId: string) => void;

  readonly searchQuery: string;
  readonly onSearchQueryChange: (query: string) => void;
  readonly phaseFilter: string;
  readonly allPhasesValue: string;
  readonly onPhaseFilterChange: (phase: string) => void;
  readonly availablePhases: readonly string[];
  readonly onClearFilters: () => void;

  readonly statuses: Readonly<Record<string, FtProcedureStatus>>;
  readonly progressPersistenceLabel: string;

  readonly sourcePolicy: ContentSourcePolicy | undefined;
  readonly operateProps: FtProcedureOperateProps | undefined;
  readonly completionText?: string;
  readonly onResetProcedure?: () => void;
  readonly previousProcedure?: AircraftProcedureDefinition;
  readonly nextProcedure?: AircraftProcedureDefinition;
  readonly onPreviousProcedure?: () => void;
  readonly onNextProcedure?: () => void;
};

export function FtProceduresPage({
  procedures,
  visibleProcedures,
  selectedProcedure,
  selectedProcedureId,
  selectedProcedureIsVisible,
  onSelectProcedure,
  searchQuery,
  onSearchQueryChange,
  phaseFilter,
  allPhasesValue,
  onPhaseFilterChange,
  availablePhases,
  onClearFilters,
  statuses,
  progressPersistenceLabel,
  sourcePolicy,
  operateProps,
  completionText,
  onResetProcedure,
  previousProcedure,
  nextProcedure,
  onPreviousProcedure,
  onNextProcedure,
}: FtProceduresPageProps) {
  return (
    <section
      className={styles.page}
      data-ft-procedures-page="true"
      aria-label="Procedures workspace"
    >
      <FtProcedureIndex
        procedures={visibleProcedures}
        selectedProcedureId={selectedProcedureId}
        onSelectProcedure={onSelectProcedure}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        phaseFilter={phaseFilter}
        allPhasesValue={allPhasesValue}
        onPhaseFilterChange={onPhaseFilterChange}
        availablePhases={availablePhases}
        statuses={statuses}
        progressPersistenceLabel={progressPersistenceLabel}
        onClearFilters={onClearFilters}
      />

      <div className={styles.detailColumn}>
        {!procedures.length ? (
          <div className={styles.pageEmpty}>
            <strong>No procedures published</strong>
            <p>No procedures are published for this aircraft.</p>
          </div>
        ) : selectedProcedure && selectedProcedureIsVisible ? (
          <FtProcedureDetail
            procedure={selectedProcedure}
            sourcePolicy={sourcePolicy}
            operateProps={operateProps}
            completionText={completionText}
            onResetProcedure={onResetProcedure}
            previousProcedure={previousProcedure}
            nextProcedure={nextProcedure}
            onPreviousProcedure={onPreviousProcedure}
            onNextProcedure={onNextProcedure}
          />
        ) : selectedProcedure ? (
          <div className={styles.pageEmpty}>
            <p>Selected procedure is filtered out by the current filters.</p>
          </div>
        ) : visibleProcedures.length ? (
          <div className={styles.pageEmpty}>
            <p>Choose a procedure.</p>
          </div>
        ) : (
          <div className={styles.pageEmpty}>
            <p>No procedure matches the current filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
