import type { ActiveFlight } from "@/lib/active-flight/types";
import type { PilotTakeoffCalculatorDefinition } from "@/lib/pilot-takeoff-calculator";
import type { PerformanceDataset } from "@/lib/universal-aircraft-content";

import { FtActiveFlight } from "./FtActiveFlight";
import { FtFlightBrief } from "./FtFlightBrief";
import { FtRecentFlights } from "./FtRecentFlights";
import styles from "./ft-flight.module.css";

export function FtFlightPage({
  aircraftId,
  aircraftName,
  selectedVariant,
  activeFlight,
  performanceDatasets,
  takeoffCalculator,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  selectedVariant?: string;
  activeFlight?: ActiveFlight | null;
  performanceDatasets: readonly PerformanceDataset[];
  takeoffCalculator?: PilotTakeoffCalculatorDefinition;
}>) {
  return (
    <main className={styles.flightPage} aria-label="Flight workspace" data-ft-flight-page="true">
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>FLIGHT</p>
        <h1>Flight</h1>
        <p className={styles.pageContext}>{aircraftName}</p>
      </header>

      <FtActiveFlight
        aircraftId={aircraftId}
        selectedVariant={selectedVariant}
        activeFlight={activeFlight}
      />
      <FtFlightBrief
        aircraftId={aircraftId}
        activeFlight={activeFlight}
        selectedVariant={selectedVariant}
        datasets={performanceDatasets}
        takeoffCalculator={takeoffCalculator}
      />
      <FtRecentFlights />
    </main>
  );
}
