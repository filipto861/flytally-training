"use client";

import {
  formatPilotTakeoffMetric,
  type PilotTakeoffMetricResult,
} from "@/lib/pilot-takeoff-calculator";
import type { PerformanceResult } from "@/lib/performance/client";

import styles from "./ft-performance.module.css";

type Metric = {
  readonly key: "n1" | "v1" | "vr" | "v2" | "takeoffDistance";
  readonly label: string;
  readonly result: PilotTakeoffMetricResult;
};

function metricValue(result: PilotTakeoffMetricResult): string {
  if (result.status === "out-of-range") return "Out of range";
  if (result.status === "unavailable") return "Unavailable";
  if (result.status !== "ready") return "—";
  return formatPilotTakeoffMetric(result);
}

export function FtPerformanceStrip({
  result,
  stale = false,
}: Readonly<{
  result: PerformanceResult;
  stale?: boolean;
}>) {
  const metrics: readonly Metric[] = [
    { key: "n1", label: "N1", result: result.n1 },
    { key: "v1", label: "V1", result: result.v1 },
    { key: "vr", label: "VR", result: result.vr },
    { key: "v2", label: "V2", result: result.v2 },
    {
      key: "takeoffDistance",
      label: "Takeoff Distance",
      result: result.takeoffDistance,
    },
  ];

  return (
    <div
      className={styles.strip}
      data-ft-performance-strip="true"
      data-stale={stale ? "true" : "false"}
      aria-label="Takeoff performance"
    >
      {metrics.map((metric) => (
        <div className={styles.metric} data-metric={metric.key} key={metric.key}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <strong className={styles.metricValue}>{metricValue(metric.result)}</strong>
          {metric.result.status !== "ready" && metric.result.reason ? (
            <span className={styles.metricHint}>{metric.result.reason}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
