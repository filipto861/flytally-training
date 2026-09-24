import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotLandingCalculatorDefinition } from "@/lib/pilot-landing-calculator";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";

import { FtPerformanceExplanation } from "./FtPerformanceExplanation";
import { FtLandingPerformancePresentation } from "./FtLandingPerformancePresentation";
import { FtPerformancePresentation } from "./FtPerformancePresentation";
import styles from "./ft-performance.module.css";

export function FtPerformancePage({
  aircraftId,
  aircraftName,
  activeFlight,
  selectedVariant,
  datasets,
  takeoffCalculator,
  landingCalculator,
  disclaimer,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  activeFlight?: ActiveFlight | null;
  selectedVariant?: string;
  datasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
  landingCalculator?: PilotLandingCalculatorDefinition;
  disclaimer?: string;
}>) {
  return (
    <main
      className={styles.page}
      aria-label="Performance workspace"
      data-ft-performance-page="true"
    >
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>PERFORMANCE</p>
        <h1>Performance</h1>
        <p className={styles.inputHelp}>{aircraftName}</p>
      </header>

      <FtPerformancePresentation
        aircraftId={aircraftId}
        activeFlight={activeFlight}
        selectedVariant={selectedVariant}
        datasets={datasets}
        takeoffCalculator={takeoffCalculator}
        view="efb"
        showInputs
      />

      {landingCalculator ? (
        <FtLandingPerformancePresentation
          aircraftId={aircraftId}
          activeFlight={activeFlight}
          selectedVariant={selectedVariant}
          datasets={datasets}
          landingCalculator={landingCalculator}
          view="efb"
          showInputs
        />
      ) : null}

      <FtPerformanceExplanation
        sourceTitles={datasets.map((dataset) => dataset.title)}
        disclaimer={disclaimer}
      />
    </main>
  );
}
