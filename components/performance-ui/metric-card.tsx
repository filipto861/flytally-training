import { SourceBadge, type PerformanceUiSource } from "./source-badge";

import styles from "./metric-card.module.css";

export type MetricStatus = "ready" | "out-of-range" | "unavailable" | "pending";

export interface MetricCardProps {
  readonly label: string;
  readonly value: string | number | null;
  readonly unit?: string;
  readonly status: MetricStatus;
  readonly hint?: string;
  readonly source?: Exclude<PerformanceUiSource, "editable">;
}

export function MetricCard({
  label,
  value,
  unit,
  status,
  hint,
  source,
}: MetricCardProps) {
  const displayValue = value === null ? "—" : String(value);
  const renderedValue = unit && value !== null ? `${displayValue} ${unit}` : displayValue;

  return (
    <div className={styles.card} data-result={label} data-status={status}>
      {source ? (
        <div className={styles.labelRail}>
          <span className={styles.label}>{label}</span>
          <SourceBadge kind={source} />
        </div>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      <strong>{renderedValue}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
