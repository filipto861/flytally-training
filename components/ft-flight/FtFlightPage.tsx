import { FtActiveFlight } from "./FtActiveFlight";
import { FtFlightBrief } from "./FtFlightBrief";
import { FtRecentFlights } from "./FtRecentFlights";
import styles from "./ft-flight.module.css";

export function FtFlightPage({
  aircraftId,
  aircraftName,
  selectedVariant,
}: Readonly<{
  aircraftId: string;
  aircraftName: string;
  selectedVariant?: string;
}>) {
  return (
    <main className={styles.flightPage} aria-label="Flight workspace" data-ft-flight-page="true">
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>FLIGHT</p>
        <h1>Flight</h1>
        <p className={styles.pageContext}>{aircraftName}</p>
      </header>

      <FtActiveFlight aircraftId={aircraftId} selectedVariant={selectedVariant} />
      <FtFlightBrief />
      <FtRecentFlights />
    </main>
  );
}
