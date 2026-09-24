"use client";

import {
  formatPilotTakeoffMetric,
  type PilotTakeoffMetricResult,
} from "@/lib/pilot-takeoff-calculator";
import type { LandingPerformanceResult } from "@/lib/performance/client";

import styles from "./ft-performance.module.css";

type Metric = {
  readonly key:
    | "vref"
    | "landingClimbSpeed"
    | "approachClimbSpeed"
    | "landingDistance";
  readonly label: string;
  readonly result: PilotTakeoffMetricResult;
};

function metricValue(result: PilotTakeoffMetricResult): string {
  if (result.status === "out-of-range") return "Out of range";
  if (result.status === "unavailable") return "Unavailable";
  if (result.status !== "ready") return "—";
  return formatPilotTakeoffMetric(result);
}

export function FtLandingPerformanceStrip({
  result,
  stale = false,
}: Readonly<{
  result: LandingPerformanceResult;
  stale?: boolean;
}>) {
  const metrics: readonly Metric[] = [
    { key: "vref", label: "VREF", result: result.vref },
    {
      key: "landingClimbSpeed",
      label: "Landing Climb",
      result: result.landingClimbSpeed,
    },
    {
      key: "approachClimbSpeed",
      label: "Approach Climb",
      result: result.approachClimbSpeed,
    },
    {
      key: "landingDistance",
      label: "Landing Distance",
      result: result.landingDistance,
    },
  ];

  return (
    <div
      className={styles.strip}
      data-ft-landing-performance-strip="true"
      data-stale={stale ? "true" : "false"}
      aria-label="Landing performance"
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
