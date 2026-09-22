"use client";

import { ProcedureGraphRunner } from "@/components/procedure-graph-runner";
import { ProcedureLinearRunner } from "@/components/procedure-linear-runner";

import styles from "./ft-procedures.module.css";

type LinearRunnerProps = Parameters<typeof ProcedureLinearRunner>[0];
type GraphRunnerProps = Parameters<typeof ProcedureGraphRunner>[0];

export type FtProcedureOperateProps = LinearRunnerProps | GraphRunnerProps;

function isGraphOperateProps(
  props: FtProcedureOperateProps,
): props is GraphRunnerProps {
  return props.procedure.graph !== undefined;
}

export function FtProcedureOperate(props: FtProcedureOperateProps) {
  if (isGraphOperateProps(props)) {
    const {
      procedure,
      state,
      onAdvance,
      onSelectDecision,
    } = props;

    return (
      <section className={styles.operateSection} aria-label="Operate">
        <header className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>OPERATE</p>
          <h3>Execute the procedure</h3>
        </header>

        <div className={styles.operateBody}>
          <ProcedureGraphRunner
            procedure={procedure}
            state={state}
            onAdvance={onAdvance}
            onSelectDecision={onSelectDecision}
          />
        </div>
      </section>
    );
  }

  const {
    procedure,
    completedStepKeys,
    onToggleStep,
  } = props;

  return (
    <section className={styles.operateSection} aria-label="Operate">
      <header className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>OPERATE</p>
        <h3>Execute the procedure</h3>
      </header>

      <div className={styles.operateBody}>
        <ProcedureLinearRunner
          procedure={procedure}
          completedStepKeys={completedStepKeys}
          onToggleStep={onToggleStep}
        />
      </div>
    </section>
  );
}
