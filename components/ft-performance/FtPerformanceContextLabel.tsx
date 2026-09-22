import styles from "./ft-performance.module.css";

export type FtPerformanceContextKind = "training" | "brief" | "operational";

const LABELS: Readonly<Record<FtPerformanceContextKind, string>> = {
  training: "Training view",
  brief: "Flight brief",
  operational: "Operational",
};

export function FtPerformanceContextLabel({
  context,
}: Readonly<{ context: FtPerformanceContextKind }>) {
  return <p className={styles.contextLabel}>{LABELS[context]}</p>;
}
