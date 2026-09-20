import styles from "./source-badge.module.css";

export type PerformanceUiSource =
  | "metar"
  | "manual"
  | "airport-db"
  | "editable"
  | "computed";

export interface SourceBadgeProps {
  readonly kind: PerformanceUiSource;
}

export function SourceBadge({ kind }: SourceBadgeProps) {
  return (
    <span className={styles.badge} data-source={kind}>
      {kind}
    </span>
  );
}
