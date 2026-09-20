import { useId, type ReactNode } from "react";

import { SourceBadge, type PerformanceUiSource } from "./source-badge";

import styles from "./field-row.module.css";

export interface FieldRowProps {
  readonly label: string;
  readonly source?: Exclude<PerformanceUiSource, "editable">;
  readonly editable?: boolean;
  readonly helper?: string;
  readonly helperTooltip?: string;
  readonly helperAction?: ReactNode;
  readonly as?: "label" | "div";
  readonly children: ReactNode;
}

export function FieldRow({
  label,
  source,
  editable = false,
  helper,
  helperTooltip,
  helperAction,
  as = "label",
  children,
}: FieldRowProps) {
  const generatedId = useId();
  const tooltipId = `performance-ui-helper-${generatedId.replace(/:/g, "")}`;
  const Container = as;

  const helperContent = helper ? (
    <div className={styles.helperText}>
      <small>{helper}</small>
      {helperTooltip ? (
        <button
          aria-describedby={tooltipId}
          aria-label={`${label} information`}
          className={styles.infoButton}
          type="button"
        >
          <span aria-hidden="true">i</span>
          <span className={styles.infoTooltip} id={tooltipId} role="tooltip">
            {helperTooltip}
          </span>
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <Container className={styles.field}>
      <div className={styles.labelRail}>
        <span>{label}</span>
        {source ? <SourceBadge kind={source} /> : editable ? <SourceBadge kind="editable" /> : null}
      </div>
      {children}
      {helperContent || helperAction ? (
        <div className={styles.helperRail}>
          {helperContent}
          {helperAction}
        </div>
      ) : null}
    </Container>
  );
}
